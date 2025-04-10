import React, { useState } from 'react';
import { ethers } from 'ethers';
import '../styles/ClaimFunds.css';

function ClaimFunds({ lotteryContract, lotteryData, refreshData }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Calculate prize amount based on winner status
  const calculatePrizeAmount = () => {
    if (lotteryData.isWinner === 1) {
      // 1st place: 50% of interest pool
      return parseFloat(lotteryData.interestPool) * 0.5;
    } else if (lotteryData.isWinner === 2) {
      // 2nd place: 30% of interest pool
      return parseFloat(lotteryData.interestPool) * 0.3;
    }
    return 0;
  };
  
  // Calculate refund amount (1 PYUSD per ticket)
  const refundAmount = lotteryData.userTickets;
  const prizeAmount = calculatePrizeAmount();
  const totalClaim = refundAmount + prizeAmount;
  
  // Handle claim funds
  const handleClaimFunds = async () => {
    if (!lotteryContract) return;
    
    setLoading(true);
    setMessage({ text: 'Claiming your funds...', type: 'info' });
    
    try {
      const tx = await lotteryContract.claimFunds();
      await tx.wait();
      
      setMessage({ text: 'Funds claimed successfully!', type: 'success' });
      refreshData();
    } catch (error) {
      console.error("Error claiming funds:", error);
      setMessage({ text: 'Failed to claim funds. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-funds-container">
      <h1>Claim Your Funds</h1>
      
      {!lotteryData.drawCompleted ? (
        <div className="draw-pending-message">
          <h2>Draw Pending</h2>
          <p>The lottery draw has not been completed yet. Check back later to claim your funds.</p>
        </div>
      ) : lotteryData.userTickets === 0 ? (
        <div className="no-tickets-message">
          <h2>No Tickets Purchased</h2>
          <p>You don't have any tickets to claim funds for.</p>
        </div>
      ) : lotteryData.hasClaimed ? (
        <div className="already-claimed-message">
          <h2>Funds Already Claimed</h2>
          <p>You have already claimed your funds for this lottery round.</p>
        </div>
      ) : (
        <div className="claim-details">
          <div className="claim-summary">
            <div className="claim-item">
              <h3>Tickets Purchased</h3>
              <p>{lotteryData.userTickets}</p>
            </div>
            
            <div className="claim-item">
              <h3>Refund Amount</h3>
              <p>{refundAmount} PYUSD</p>
            </div>
            
            {lotteryData.isWinner > 0 && (
              <div className="claim-item prize">
                <h3>Prize Amount ({lotteryData.isWinner === 1 ? '1st Place' : '2nd Place'})</h3>
                <p>{prizeAmount.toFixed(2)} PYUSD</p>
              </div>
            )}
            
            <div className="claim-item total">
              <h3>Total Claim</h3>
              <p>{totalClaim.toFixed(2)} PYUSD</p>
            </div>
          </div>
          
          {message.text && (
            <div className={`claim-message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          <button 
            className="claim-button"
            onClick={handleClaimFunds}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Claim Funds'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ClaimFunds;