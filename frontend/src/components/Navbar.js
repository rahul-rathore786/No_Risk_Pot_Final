import React from 'react';
import '../styles/Navbar.css';

function Navbar({ account, connectWallet, setPage, isOwner, pyusdBalance }) {
  return (
    <div className="navbar">
      <div className="navbar-logo" onClick={() => setPage('home')}>
        <span className="logo-text">NoRiskPot</span>
        <span className="logo-subtitle">Zero Loss Lottery</span>
      </div>
      
      <div className="navbar-links">
        <button className="nav-link" onClick={() => setPage('home')}>Home</button>
        <button className="nav-link" onClick={() => setPage('buy')}>Buy Tickets</button>
        <button className="nav-link" onClick={() => setPage('claim')}>Claim Funds</button>
        {isOwner && (
          <button className="nav-link admin" onClick={() => setPage('admin')}>Admin Panel</button>
        )}
      </div>
      
      <div className="navbar-wallet">
        {account ? (
          <div className="wallet-info">
            <div className="wallet-balance">{parseFloat(pyusdBalance).toFixed(2)} PYUSD</div>
            <div className="wallet-address">{`${account.slice(0, 6)}...${account.slice(-4)}`}</div>
          </div>
        ) : (
          <button className="connect-btn" onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>
    </div>
  );
}

export default Navbar;