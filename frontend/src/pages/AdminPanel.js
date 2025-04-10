import React, { useState } from "react";
import { ethers } from "ethers";
import "../styles/AdminPanel.css";

function AdminPanel({
  lotteryContract,
  pyusdContract,
  lotteryData,
  refreshData,
  parsePyusd,
}) {
  const [interestPercentage, setInterestPercentage] = useState(10);
  const [randomSeed, setRandomSeed] = useState(
    Math.floor(Math.random() * 1000000)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleInterestChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setInterestPercentage(value);
    }
  };

  const handleRandomSeedChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setRandomSeed(value);
    }
  };

  const handleAddInterest = async () => {
    if (!lotteryContract || !pyusdContract) return;

    setLoading(true);
    setMessage({ text: "Adding interest...", type: "info" });

    try {
      const totalInterestAmount =
        (lotteryData.totalTickets * interestPercentage) / 100;
      const amountToApprove = parsePyusd(totalInterestAmount);

      // First approve PYUSD
      const approveTx = await pyusdContract.approve(
        lotteryContract.address,
        amountToApprove
      );
      await approveTx.wait();

      // Then add interest
      const tx = await lotteryContract.addInterest(interestPercentage);
      await tx.wait();

      setMessage({ text: "Interest added successfully!", type: "success" });
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

  const handleDrawWinners = async () => {
    if (!lotteryContract) return;

    setLoading(true);
    setMessage({ text: "Drawing winners...", type: "info" });

    try {
      const tx = await lotteryContract.drawWinners(randomSeed);
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

  const handleClaimPlatformFee = async () => {
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

      <div className="admin-section">
        <h2>Lottery Status</h2>
        <div className="status-summary">
          <div className="status-item">
            <h3>Total Tickets</h3>
            <p>{lotteryData.totalTickets}</p>
          </div>

          <div className="status-item">
            <h3>Interest Pool</h3>
            <p>{parseFloat(lotteryData.interestPool).toFixed(2)} PYUSD</p>
          </div>

          <div className="status-item">
            <h3>Draw Status</h3>
            <p className={lotteryData.drawCompleted ? "completed" : "pending"}>
              {lotteryData.drawCompleted ? "Completed" : "Pending"}
            </p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`admin-message ${message.type}`}>{message.text}</div>
      )}

      <div className="admin-section">
        <h2>Actions</h2>

        {!lotteryData.drawCompleted ? (
          <>
            <div className="action-card">
              <h3>Add Interest</h3>
              <p>
                Add interest to the lottery pool as a percentage of the total
                ticket value.
              </p>

              <div className="input-group">
                <label htmlFor="interest-percentage">
                  Interest Percentage (%)
                </label>
                <input
                  type="number"
                  id="interest-percentage"
                  value={interestPercentage}
                  onChange={handleInterestChange}
                  min="1"
                  max="100"
                  disabled={loading || lotteryData.totalTickets === 0}
                />
              </div>

              <div className="action-info">
                <p>
                  Total Interest Amount:{" "}
                  {(
                    (lotteryData.totalTickets * interestPercentage) /
                    100
                  ).toFixed(2)}{" "}
                  PYUSD
                </p>
              </div>

              <button
                className="admin-button add-interest-button"
                onClick={handleAddInterest}
                disabled={loading || lotteryData.totalTickets === 0}
              >
                {loading ? "Processing..." : "Add Interest"}
              </button>

              {lotteryData.totalTickets === 0 && (
                <p className="warning-text">
                  Cannot add interest until tickets are sold.
                </p>
              )}
            </div>

            <div className="action-card">
              <h3>Draw Winners</h3>
              <p>Select lottery winners based on a random seed.</p>

              <div className="input-group">
                <label htmlFor="random-seed">Random Seed</label>
                <input
                  type="number"
                  id="random-seed"
                  value={randomSeed}
                  onChange={handleRandomSeedChange}
                  min="1"
                  disabled={
                    loading ||
                    lotteryData.interestPool <= 0 ||
                    lotteryData.totalTickets < 2
                  }
                />
              </div>

              <button
                className="admin-button draw-winners-button"
                onClick={handleDrawWinners}
                disabled={
                  loading ||
                  lotteryData.interestPool <= 0 ||
                  lotteryData.totalTickets < 2
                }
              >
                {loading ? "Processing..." : "Draw Winners"}
              </button>

              {lotteryData.interestPool <= 0 && (
                <p className="warning-text">
                  Cannot draw winners until interest is added.
                </p>
              )}

              {lotteryData.totalTickets < 2 && (
                <p className="warning-text">
                  Need at least 2 participants to draw winners.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="action-card">
            <h3>Claim Platform Fee</h3>
            <p>
              Claim the platform fee (20% of interest) and reset the lottery for
              the next round.
            </p>

            <div className="action-info">
              <p>
                Platform Fee:{" "}
                {(parseFloat(lotteryData.interestPool) * 0.2).toFixed(2)} PYUSD
              </p>
            </div>

            <button
              className="admin-button claim-fee-button"
              onClick={handleClaimPlatformFee}
              disabled={loading}
            >
              {loading ? "Processing..." : "Claim Fee & Reset Lottery"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
