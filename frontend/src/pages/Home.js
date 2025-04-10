import React from "react";
import "../styles/Home.css";

function Home({ lotteryData, setPage, isOwner }) {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">The First Zero-Loss Lottery</h1>
        <p className="hero-subtitle">
          Buy a lottery ticket with zero risk – if you don’t win, you get your money back, because your money is safely used to earn interest, and winners are paid from that!
        </p>
        {!lotteryData.drawCompleted ? (
          <button className="cta-button" onClick={() => setPage("buy")}>
            Buy Tickets Now
          </button>
        ) : (
          <button className="cta-button" onClick={() => setPage("claim")}>
            Claim Your Funds
          </button>
        )}

        {parseFloat(lotteryData.pyusdBalance) === 0 && (
          <div className="pyusd-info">
            <p>
              Need PYUSD tokens to play?{" "}
              <button onClick={() => setPage("buy")} className="pyusd-link">
                Get PYUSD here
              </button>
            </p>
          </div>
        )}
      </div>

      <div className="lottery-stats">
        <div className="stat-card">
          <h3>Lottery Status</h3>
          <div
            className={`status-badge ${
              lotteryData.drawCompleted ? "completed" : "active"
            }`}
          >
            {lotteryData.drawCompleted ? "Draw Completed" : "Draw Pending"}
          </div>
        </div>

        <div className="stat-card">
          <h3>Total Tickets Sold</h3>
          <div className="stat-value">{lotteryData.totalTickets}</div>
        </div>

        <div className="stat-card">
          <h3>Total Pool Size</h3>
          <div className="stat-value">{lotteryData.totalTickets} PYUSD</div>
        </div>

        <div className="stat-card">
          <h3>Interest Pool</h3>
          <div className="stat-value highlight">
            {parseFloat(lotteryData.interestPool).toFixed(2)} PYUSD
          </div>
        </div>
      </div>

      <div className="user-dashboard">
        <h2>Your Dashboard</h2>
        <div className="dashboard-stats">
          <div className="dashboard-card">
            <h3>Your Tickets</h3>
            <div className="dashboard-value">{lotteryData.userTickets}/10</div>
          </div>

          <div className="dashboard-card">
            <h3>Your PYUSD Balance</h3>
            <div className="dashboard-value">
              {parseFloat(lotteryData.pyusdBalance).toFixed(2)} PYUSD
            </div>
          </div>

          {lotteryData.isWinner > 0 && (
            <div className="dashboard-card winner">
              <h3>Winner Status</h3>
              <div className="dashboard-value">
                {lotteryData.isWinner === 1 ? "1st Place! 🏆" : "2nd Place! 🥈"}
              </div>
            </div>
          )}

          {lotteryData.userTickets > 0 &&
            !lotteryData.hasClaimed &&
            lotteryData.drawCompleted && (
              <div className="dashboard-card action">
                <h3>Claim Status</h3>
                <button
                  className="claim-button"
                  onClick={() => setPage("claim")}
                >
                  Claim Available
                </button>
              </div>
            )}

          {lotteryData.userTickets < 10 && !lotteryData.drawCompleted && (
            <div className="dashboard-card action">
              <h3>Tickets Available</h3>
              <button
                className="buy-more-button"
                onClick={() => setPage("buy")}
              >
                Buy More Tickets
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="how-it-works">
        <h2>How NoRiskPot Works</h2>
        <div className="steps-flow">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Buy Tickets</h3>
            <p>Purchase up to 10 tickets at 1 PYUSD each.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Wait for the Draw</h3>
            <p>The admin adds interest and selects winners.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Your Money Back</h3>
            <p>Everyone gets their initial investment back!</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Win Prizes</h3>
            <p>Winners will get the interest Share: 50% for 1st, 30% for 2nd place.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
