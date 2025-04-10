import React, { useState } from "react";
import { ethers } from "ethers";
import "../styles/AdminPanel.css";
import TokenTransfer from "../components/TokenTransfer";
import "../styles/TokenTransfer.css";
function AdminPanel({
  lotteryContract,
  pyusdContract,
  lotteryData,
  refreshData,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Add 10% interest
  const addTenPercentInterest = async () => {
    await addInterest(10);
  };

  // Add 2.5% interest
  const addQuarterPercentInterest = async () => {
    await addInterest(2.5);
  };

  // Generic function to add interest
  const addInterest = async (percentage) => {
    if (!lotteryContract || !pyusdContract) return;

    setLoading(true);
    setMessage({ text: `Adding ${percentage}% interest...`, type: "info" });

    try {
      // Calculate interest amount
      const interestAmount = (lotteryData.totalTickets * percentage) / 100;

      // First approve PYUSD transfer
      const interestWei = ethers.utils.parseEther(interestAmount.toString());
      const approveTx = await pyusdContract.approve(
        lotteryContract.address,
        interestWei
      );
      await approveTx.wait();

      // Then add interest
      // For 2.5%, we pass 2 or 3 since the contract only accepts integers
      const percentageInt = percentage === 2.5 ? 2 : Math.round(percentage);
      const addTx = await lotteryContract.addInterest(percentageInt);
      await addTx.wait();

      setMessage({
        text: `Successfully added ${percentage}% interest!`,
        type: "success",
      });
      refreshData();
    } catch (error) {
      console.error("Error adding interest:", error);
      setMessage({
        text: "Failed to add interest. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Draw winners
  const drawWinners = async () => {
    if (!lotteryContract) return;

    setLoading(true);
    setMessage({ text: "Drawing winners...", type: "info" });

    try {
      // Generate a random seed
      const seed = Math.floor(Math.random() * 1000000);

      const tx = await lotteryContract.drawWinners(seed);
      await tx.wait();

      setMessage({ text: "Winners drawn successfully!", type: "success" });
      refreshData();
    } catch (error) {
      console.error("Error drawing winners:", error);
      setMessage({
        text: "Failed to draw winners. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Claim platform fee
  const claimPlatformFee = async () => {
    if (!lotteryContract) return;

    setLoading(true);
    setMessage({ text: "Claiming platform fee...", type: "info" });

    try {
      const tx = await lotteryContract.claimPlatformFee();
      await tx.wait();

      setMessage({
        text: "Platform fee claimed successfully!",
        type: "success",
      });
      refreshData();
    } catch (error) {
      console.error("Error claiming platform fee:", error);
      setMessage({
        text: "Failed to claim platform fee. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel-container">
      <h1>Admin Panel</h1>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <h3>Total Pool Size</h3>
          <p>{lotteryData.totalTickets} PYUSD</p>
        </div>
        <div className="admin-stat-card">
          <h3>Interest Pool</h3>
          <p>{parseFloat(lotteryData.interestPool).toFixed(2)} PYUSD</p>
        </div>
        <div className="admin-stat-card">
          <h3>Draw Status</h3>
          <p className={lotteryData.drawCompleted ? "completed" : "pending"}>
            {lotteryData.drawCompleted ? "Completed" : "Pending"}
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`admin-message ${message.type}`}>{message.text}</div>
      )}

      <div className="admin-panels">
        <div className="admin-panel-section">
          <h2>Interest Management</h2>
          <p>Add interest to the lottery pool from your wallet</p>

          <div className="admin-buttons">
            <button
              className="admin-button interest-10"
              onClick={addTenPercentInterest}
              disabled={
                loading ||
                lotteryData.totalTickets === 0 ||
                lotteryData.drawCompleted
              }
            >
              Add 10% Interest
            </button>
            <button
              className="admin-button interest-2-5"
              onClick={addQuarterPercentInterest}
              disabled={
                loading ||
                lotteryData.totalTickets === 0 ||
                lotteryData.drawCompleted
              }
            >
              Add 2.5% Interest
            </button>
          </div>
        </div>

        <div className="admin-panel-section">
          <h2>Draw Management</h2>
          <p>Draw winners and manage lottery cycle</p>

          <div className="admin-buttons">
            <button
              className="admin-button draw"
              onClick={drawWinners}
              disabled={
                loading ||
                lotteryData.totalTickets < 2 ||
                lotteryData.interestPool <= 0 ||
                lotteryData.drawCompleted
              }
            >
              Draw Winners
            </button>
            {lotteryData.drawCompleted && (
              <button
                className="admin-button claim-fee"
                onClick={claimPlatformFee}
                disabled={loading}
              >
                Claim Platform Fee
              </button>
            )}
          </div>
        </div>
      </div>

      {lotteryData.totalTickets < 2 && !lotteryData.drawCompleted && (
        <div className="admin-info-message">
          At least 2 participants are needed before drawing winners.
        </div>
      )}
      {lotteryData.interestPool <= 0 && !lotteryData.drawCompleted && (
        <div className="admin-info-message">
          Add interest to the pool before drawing winners.
        </div>
      )}

      <div className="admin-panel-section">
        <h2>Token Management</h2>
        <TokenTransfer pyusdContract={pyusdContract} />
      </div>
    </div>
  );
}

export default AdminPanel;
