import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import contractAddresses from "./contracts/addresses.json";

// Components
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import BuyTickets from "./pages/BuyTickets";
import AdminPanel from "./pages/AdminPanel";
import ClaimFunds from "./pages/ClaimFunds";

// Contract ABIs
import ZeroLossLotteryABI from "./artifacts/contracts/ZeroLossLottery.sol/ZeroLossLottery.json";
import PYUSDABI from "./artifacts/contracts/MockPYUSD.sol/MockPYUSD.json";

function App() {
  // State variables
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [lotteryContract, setLotteryContract] = useState(null);
  const [pyusdContract, setPyusdContract] = useState(null);
  const [lotteryAddress, setLotteryAddress] = useState("");
  const [pyusdAddress, setPyusdAddress] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [page, setPage] = useState("home");
  const [lotteryData, setLotteryData] = useState({
    totalTickets: 0,
    interestPool: 0,
    drawCompleted: false,
    userTickets: 0,
    pyusdBalance: 0,
    isWinner: 0,
    hasClaimed: false,
  });

  // Initialize web3 provider
  const initProvider = async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await web3Provider.send("eth_requestAccounts", []);
        const networkId = await web3Provider.getNetwork();

        if (networkId.chainId !== 11155111) {
          alert("Please connect to Sepolia Testnet");
          return;
        }

        const web3Signer = web3Provider.getSigner();
        const address = await web3Signer.getAddress();

        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(address);

        // Replace with your deployed contract addresses
        // const lotteryAddr = "YOUR_DEPLOYED_LOTTERY_CONTRACT_ADDRESS";
        // const pyusdAddr = "YOUR_DEPLOYED_PYUSD_CONTRACT_ADDRESS";

        const lotteryAddr = contractAddresses.ZeroLossLottery;
        const pyusdAddr = contractAddresses.MockPYUSD;
        setLotteryAddress(lotteryAddr);
        setPyusdAddress(pyusdAddr);

        const lottery = new ethers.Contract(
          lotteryAddr,
          ZeroLossLotteryABI.abi,
          web3Signer
        );
        setLotteryContract(lottery);

        const pyusd = new ethers.Contract(pyusdAddr, PYUSDABI.abi, web3Signer);
        setPyusdContract(pyusd);

        // Check if user is owner
        const owner = await lottery.owner();
        setIsOwner(owner.toLowerCase() === address.toLowerCase());

        // Load lottery data
        await refreshLotteryData(lottery, pyusd, address);
      } catch (error) {
        console.error("Error initializing provider:", error);
        alert("Failed to connect wallet. Please try again.");
      }
    } else {
      alert("Please install MetaMask to use this dApp");
    }
  };

  // Refresh lottery data
  const refreshLotteryData = async (lottery, pyusd, address) => {
    if (!lottery || !pyusd) return;

    try {
      const totalTickets = await lottery.totalTickets();
      const interestPool = await lottery.interestPool();
      const drawCompleted = await lottery.drawCompleted();
      const userTickets = await lottery.tickets(address);
      const pyusdBalance = await pyusd.balanceOf(address);
      const isWinner = await lottery.isWinner(address);
      const hasClaimed = await lottery.hasClaimed(address);

      setLotteryData({
        totalTickets: totalTickets.toNumber(),
        interestPool: ethers.utils.formatEther(interestPool),
        drawCompleted,
        userTickets: userTickets.toNumber(),
        pyusdBalance: ethers.utils.formatEther(pyusdBalance),
        isWinner: isWinner,
        hasClaimed,
      });
    } catch (error) {
      console.error("Error refreshing lottery data:", error);
    }
  };

  useEffect(() => {
    if (account && lotteryContract && pyusdContract) {
      refreshLotteryData(lotteryContract, pyusdContract, account);

      // Set up event listeners
      const ticketsPurchasedFilter = lotteryContract.filters.TicketsPurchased();
      const interestAddedFilter = lotteryContract.filters.InterestAdded();
      const drawCompletedFilter = lotteryContract.filters.DrawCompleted();
      const fundsClaimedFilter = lotteryContract.filters.FundsClaimed();

      lotteryContract.on(ticketsPurchasedFilter, () =>
        refreshLotteryData(lotteryContract, pyusdContract, account)
      );
      lotteryContract.on(interestAddedFilter, () =>
        refreshLotteryData(lotteryContract, pyusdContract, account)
      );
      lotteryContract.on(drawCompletedFilter, () =>
        refreshLotteryData(lotteryContract, pyusdContract, account)
      );
      lotteryContract.on(fundsClaimedFilter, () =>
        refreshLotteryData(lotteryContract, pyusdContract, account)
      );

      return () => {
        lotteryContract.removeAllListeners(ticketsPurchasedFilter);
        lotteryContract.removeAllListeners(interestAddedFilter);
        lotteryContract.removeAllListeners(drawCompletedFilter);
        lotteryContract.removeAllListeners(fundsClaimedFilter);
      };
    }
  }, [account, lotteryContract, pyusdContract]);

  // Render different pages based on state
  const renderPage = () => {
    switch (page) {
      case "buy":
        return (
          <BuyTickets
            lotteryContract={lotteryContract}
            pyusdContract={pyusdContract}
            lotteryData={lotteryData}
            refreshData={() =>
              refreshLotteryData(lotteryContract, pyusdContract, account)
            }
          />
        );
      case "admin":
        return isOwner ? (
          <AdminPanel
            lotteryContract={lotteryContract}
            pyusdContract={pyusdContract}
            lotteryData={lotteryData}
            refreshData={() =>
              refreshLotteryData(lotteryContract, pyusdContract, account)
            }
          />
        ) : (
          <div className="error-message">
            You are not authorized to access this page.
          </div>
        );
      case "claim":
        return (
          <ClaimFunds
            lotteryContract={lotteryContract}
            lotteryData={lotteryData}
            refreshData={() =>
              refreshLotteryData(lotteryContract, pyusdContract, account)
            }
          />
        );
      default:
        return (
          <Home lotteryData={lotteryData} setPage={setPage} isOwner={isOwner} />
        );
    }
  };

  return (
    <div className="app">
      <Navbar
        account={account}
        connectWallet={initProvider}
        setPage={setPage}
        isOwner={isOwner}
        pyusdBalance={lotteryData.pyusdBalance}
      />
      <div className="container">{renderPage()}</div>
    </div>
  );
}

export default App;
