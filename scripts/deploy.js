const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Actual PYUSD token address on Sepolia testnet
const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"; // Updated PYUSD address on Sepolia

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // We don't need to deploy MockPYUSD anymore as we'll use the real PYUSD token

  // Deploy ZeroLossLottery using the real PYUSD address
  const ZeroLossLottery = await hre.ethers.getContractFactory(
    "ZeroLossLottery"
  );
  const lottery = await ZeroLossLottery.deploy(PYUSD_ADDRESS);
  await lottery.deployed();
  console.log("ZeroLossLottery deployed to:", lottery.address);

  // Save the contract addresses to a file that the frontend can access
  const contractAddresses = {
    ZeroLossLottery: lottery.address,
    PYUSD: PYUSD_ADDRESS, // Changed from MockPYUSD to PYUSD
  };

  // Create a config file for the frontend
  fs.writeFileSync(
    path.join(__dirname, "../frontend/src/contracts/addresses.json"),
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log(
    "Contract addresses saved to frontend/src/contracts/addresses.json"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
