import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "../styles/BuyTickets.css";
import PyusdFaucetInfo from "../components/PyusdFaucetInfo";

function BuyTickets({
  lotteryContract,
  pyusdContract,
  lotteryData,
  refreshData,
  parsePyusd,
}) {
  const [numTickets, setNumTickets] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isApproved, setIsApproved] = useState(false);

  const maxTicketsAvailable = 10 - lotteryData.userTickets;
  const totalCost = numTickets;
  const hasSufficientPyusd = parseFloat(lotteryData.pyusdBalance) >= totalCost;

  // Check if PYUSD is already approved
  useEffect(() => {
    const checkAllowance = async () => {
      if (pyusdContract && lotteryContract) {
        try {
          const address = await pyusdContract.signer.getAddress();
          const allowance = await pyusdContract.allowance(
            address,
            lotteryContract.address
          );
          const amountNeeded = parsePyusd(totalCost);
          setIsApproved(allowance.gte(amountNeeded));
        } catch (error) {
          console.error("Error checking allowance:", error);
        }
      }
    };

    checkAllowance();
  }, [pyusdContract, lotteryContract, totalCost, parsePyusd]);

  const handleNumTicketsChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= maxTicketsAvailable) {
      setNumTickets(value);
    }
  };

  const handleApprove = async () => {
    if (!pyusdContract) return;

    setLoading(true);
    setMessage({ text: "Approving PYUSD...", type: "info" });

    try {
      // Use parsePyusd for handling 6 decimals
      const amountToApprove = parsePyusd(totalCost);

      const tx = await pyusdContract.approve(
        lotteryContract.address,
        amountToApprove
      );
      await tx.wait();

      setIsApproved(true);
      setMessage({ text: "PYUSD approved successfully!", type: "success" });
    } catch (error) {
      console.error("Error approving PYUSD:", error);
      setMessage({
        text: "Failed to approve PYUSD. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTickets = async () => {
    if (!lotteryContract) return;

    setLoading(true);
    setMessage({ text: "Buying tickets...", type: "info" });

    try {
      const tx = await lotteryContract.buyTickets(numTickets);
      await tx.wait();

      setMessage({
        text: `Successfully purchased ${numTickets} ticket(s)!`,
        type: "success",
      });
      refreshData();
    } catch (error) {
      console.error("Error buying tickets:", error);

      // Check if it might be an approval issue
      if (error.message.includes("allowance")) {
        setMessage({
          text: "Please approve PYUSD spending first.",
          type: "error",
        });
        setIsApproved(false);
      } else {
        setMessage({
          text: "Failed to buy tickets. Please try again.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show PYUSD Faucet Info if user has no PYUSD
  if (parseFloat(lotteryData.pyusdBalance) === 0) {
    return <PyusdFaucetInfo />;
  }

  return (
    <div className="buy-tickets-container">
      <h1>Buy Lottery Tickets</h1>

      {lotteryData.drawCompleted ? (
        <div className="draw-completed-message">
          <h2>Draw Completed</h2>
          <p>
            This lottery round has already completed. Please wait for the next
            round.
          </p>
        </div>
      ) : lotteryData.userTickets >= 10 ? (
        <div className="max-tickets-message">
          <h2>Maximum Tickets Reached</h2>
          <p>
            You have already purchased the maximum allowed tickets (10) for this
            lottery round.
          </p>
        </div>
      ) : (
        <div className="ticket-purchase-form">
          <div className="ticket-purchase-summary">
            <div className="summary-item">
              <h3>Your PYUSD Balance</h3>
              <p>{parseFloat(lotteryData.pyusdBalance).toFixed(2)} PYUSD</p>
            </div>

            <div className="summary-item">
              <h3>Tickets Owned</h3>
              <p>{lotteryData.userTickets}/10</p>
            </div>

            <div className="summary-item">
              <h3>Tickets Available</h3>
              <p>{maxTicketsAvailable}</p>
            </div>
          </div>

          <div className="ticket-selection">
            <h3>Select Number of Tickets</h3>
            <div className="ticket-input-wrapper">
              <button
                className="ticket-adjust-btn"
                onClick={() => numTickets > 1 && setNumTickets(numTickets - 1)}
                disabled={numTickets <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={numTickets}
                onChange={handleNumTicketsChange}
                min="1"
                max={maxTicketsAvailable}
                className="ticket-input"
              />
              <button
                className="ticket-adjust-btn"
                onClick={() =>
                  numTickets < maxTicketsAvailable &&
                  setNumTickets(numTickets + 1)
                }
                disabled={numTickets >= maxTicketsAvailable}
              >
                +
              </button>
            </div>
          </div>

          <div className="ticket-cost">
            <h3>Total Cost</h3>
            <p className="cost-value">{totalCost} PYUSD</p>
            {!hasSufficientPyusd && (
              <p className="insufficient-funds">
                Insufficient PYUSD balance. Visit the PYUSD faucet to get more
                tokens.
              </p>
            )}
          </div>

          {message.text && (
            <div className={`purchase-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="ticket-actions">
            {!isApproved ? (
              <button
                className="approve-button"
                onClick={handleApprove}
                disabled={loading || !hasSufficientPyusd}
              >
                {loading ? "Processing..." : "Approve PYUSD"}
              </button>
            ) : (
              <button
                className="buy-button"
                onClick={handleBuyTickets}
                disabled={loading || !hasSufficientPyusd || !isApproved}
              >
                {loading ? "Processing..." : "Buy Tickets"}
              </button>
            )}
          </div>

          <div className="faucet-reminder">
            <p>
              Need more PYUSD?{" "}
              <a
                href="https://faucet.paxos.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="faucet-link"
              >
                Access the PYUSD Faucet
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyTickets;
