import React, { useState } from 'react';
import { ethers } from 'ethers';
import '../styles/BuyTickets.css';

function BuyTickets({ lotteryContract, pyusdContract, lotteryData, refreshData }) {
  const [numTickets, setNumTickets] = useState(1);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Check allowance when component mounts
  React.useEffect(() => {
    const checkAllowance = async () => {
      if (pyusdContract && lotteryContract) {
        try {
          const signer = pyusdContract.signer;
          const address = await signer.getAddress();
          const allowance = await pyusdContract.allowance(address, lotteryContract.address);
          const ticketCost = ethers.utils.parseEther(numTickets.toString());
          setIsApproved(allowance.gte(ticketCost));
        } catch (error) {
          console.error("Error checking allowance:", error);
        }
      }
    };
    
    checkAllowance();
  }, [pyusdContract, lotteryContract, numTickets]);
  
  // Handle ticket quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= (10 - lotteryData.userTickets)) {
      setNumTickets(value);
    }
  };
  
  // Approve PYUSD spending
  const handleApprove = async () => {
    if (!pyusdContract || !lotteryContract) return;
    
    setLoading(true);
    setMessage({ text: 'Approving PYUSD spend...', type: 'info' });
    
    try {
      const ticketCost = ethers.utils.parseEther(numTickets.toString());
      const tx = await pyusdContract.approve(lotteryContract.address, ticketCost);
      await tx.wait();
      
      setIsApproved(true);
      setMessage({ text: 'PYUSD approved successfully!', type: 'success' });
    } catch (error) {
      console.error("Error approving PYUSD:", error);
      setMessage({ text: 'Failed to approve PYUSD. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Buy tickets
  const handleBuyTickets = async () => {
    if (!lotteryContract) return;
    
    setLoading(true);
    setMessage({ text: 'Purchasing tickets...', type: 'info' });
    
    try {
      const tx = await lotteryContract.buyTickets(numTickets);
      await tx.wait();
      
      setMessage({ text: `Successfully purchased ${numTickets} tickets!`, type: 'success' });
      refreshData();
    } catch (error) {
      console.error("Error buying tickets:", error);
      setMessage({ text: 'Failed to purchase tickets. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buy-tickets-container">
      <h1>Buy Lottery Tickets</h1>
      
      <div className="info-panel">
        <div className="info-item">
          <h3>Your Tickets</h3>
          <p>{lotteryData.userTickets}/10</p>
        </div>
        <div className="info-item">
          <h3>Ticket Price</h3>
          <p>1 PYUSD per ticket</p>
        </div>
        <div className="info-item">
          <h3>Your Balance</h3>
          <p>{parseFloat(lotteryData.pyusdBalance).toFixed(2)} PYUSD</p>
        </div>
      </div>
      
      {lotteryData.drawCompleted ? (
        <div className="draw-completed-message">
          <h2>Draw Already Completed</h2>
          <p>The lottery draw has already been completed. Please wait for the next round.</p>
        </div>
      ) : lotteryData.userTickets >= 10 ? (
        <div className="max-tickets-message">
          <h2>Maximum Tickets Reached</h2>
          <p>You have already purchased the maximum number of tickets (10).</p>
        </div>
      ) : (
        <div className="ticket-purchase-form">
          <div className="form-group">
            <label htmlFor="ticket-quantity">Number of Tickets</label>
            <input
              type="number"
              id="ticket-quantity"
              min="1"
              max={10 - lotteryData.userTickets}
              value={numTickets}
              onChange={handleQuantityChange}
              disabled={loading}
            />
          </div>
          
          <div className="cost-summary">
            <p>Total Cost: <span>{numTickets} PYUSD</span></p>
          </div>
          
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          <div className="action-buttons">
            {!isApproved ? (
              <button 
                className="approve-button"
                onClick={handleApprove}
                disabled={loading || lotteryData.pyusdBalance < numTickets}
              >
                {loading ? 'Processing...' : 'Approve PYUSD'}
              </button>
            ) : (
              <button 
                className="buy-button"
                onClick={handleBuyTickets}
                disabled={loading || lotteryData.pyusdBalance < numTickets}
              >
                {loading ? 'Processing...' : 'Buy Tickets'}
              </button>
            )}
          </div>
          
          {lotteryData.pyusdBalance < numTickets && (
            <div className="insufficient-balance">
              Insufficient PYUSD balance. You need {numTickets} PYUSD to purchase these tickets.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BuyTickets;