const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy MockPYUSD first
  const MockPYUSD = await hre.ethers.getContractFactory("MockPYUSD");
  const mockPYUSD = await MockPYUSD.deploy();
  await mockPYUSD.deployed();
  console.log("MockPYUSD deployed to:", mockPYUSD.address);

  // Deploy ZeroLossLottery using the MockPYUSD address
  const ZeroLossLottery = await hre.ethers.getContractFactory(
    "ZeroLossLottery"
  );
  const lottery = await ZeroLossLottery.deploy(mockPYUSD.address);
  await lottery.deployed();
  console.log("ZeroLossLottery deployed to:", lottery.address);

  // Save the contract addresses to a file that the frontend can access 
  const contractAddresses = {
    ZeroLossLottery: lottery.address,
    MockPYUSD: mockPYUSD.address,
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
