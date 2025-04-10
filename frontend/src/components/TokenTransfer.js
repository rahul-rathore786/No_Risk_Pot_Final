import React, { useState } from "react";
import { ethers } from "ethers";

const TokenTransfer = ({ pyusdContract }) => {
  const [recipientAddress, setRecipientAddress] = useState(
    "0xec14cc3826776A105083DdA7c512A37682934D9D"
  );
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleTransfer = async () => {
    if (!pyusdContract) {
      setMessage({ text: "Contract not initialized", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "Processing transfer...", type: "info" });

      // Check if contract has mint function (if you're the owner)
      let hasMint = false;
      try {
        hasMint = !!pyusdContract.mint;
      } catch (e) {
        hasMint = false;
      }

      let tx;
      if (hasMint) {
        // If you're the owner and can mint
        tx = await pyusdContract.mint(
          recipientAddress,
          ethers.utils.parseEther(amount)
        );
      } else {
        // If you're transferring from your balance
        tx = await pyusdContract.transfer(
          recipientAddress,
          ethers.utils.parseEther(amount)
        );
      }

      await tx.wait();

      setMessage({
        text: `Successfully sent ${amount} PYUSD to ${recipientAddress.substring(
          0,
          6
        )}...${recipientAddress.substring(38)}`,
        type: "success",
      });
    } catch (error) {
      console.error("Transfer error:", error);
      setMessage({
        text: `Error: ${
          error.message ? error.message : "Could not transfer tokens"
        }`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-transfer-container">
      <h2>Transfer PYUSD Tokens</h2>
      <div className="form-group">
        <label htmlFor="recipient-address">Recipient Address</label>
        <input
          type="text"
          id="recipient-address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="amount">Amount (PYUSD)</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          min="0"
          step="1"
        />
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <button
        className="transfer-button"
        onClick={handleTransfer}
        disabled={loading}
      >
        {loading ? "Processing..." : "Transfer Tokens"}
      </button>
    </div>
  );
};

export default TokenTransfer;
