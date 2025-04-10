const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZeroLossLottery", function() {
  let ZeroLossLottery, MockPYUSD;
  let zeroLossLottery, mockPYUSD;
  let owner, addr1, addr2, addr3;
  const ticketPrice = ethers.utils.parseEther("1");

  beforeEach(async function() {
    // Deploy MockPYUSD
    MockPYUSD = await ethers.getContractFactory("MockPYUSD");
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.deployed();

    // Deploy ZeroLossLottery
    ZeroLossLottery = await ethers.getContractFactory("ZeroLossLottery");
    zeroLossLottery = await ZeroLossLottery.deploy(mockPYUSD.address);
    await zeroLossLottery.deployed();

    // Get signers
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Mint PYUSD to users
    await mockPYUSD.mint(addr1.address, ethers.utils.parseEther("100"));
    await mockPYUSD.mint(addr2.address, ethers.utils.parseEther("100"));
    await mockPYUSD.mint(addr3.address, ethers.utils.parseEther("100"));
  });

  describe("Deployment", function() {
    it("Should set the right owner", async function() {
      expect(await zeroLossLottery.owner()).to.equal(owner.address);
    });

    it("Should set the right PYUSD address", async function() {
      expect(await zeroLossLottery.pyusd()).to.equal(mockPYUSD.address);
    });
  });

  describe("Buying tickets", function() {
    it("Should allow users to buy tickets", async function() {
      // Approve PYUSD spending
      await mockPYUSD.connect(addr1).approve(zeroLossLottery.address, ticketPrice.mul(3));

      // Buy tickets
      await zeroLossLottery.connect(addr1).buyTickets(3);

      // Check user's ticket count
      expect(await zeroLossLottery.tickets(addr1.address)).to.equal(3);
      expect(await zeroLossLottery.totalTickets()).to.equal(3);
    });

    it("Should not allow buying more than max tickets", async function() {
      // Approve PYUSD spending
      await mockPYUSD.connect(addr1).approve(zeroLossLottery.address, ticketPrice.mul(15));

      // Buy max tickets
      await zeroLossLottery.connect(addr1).buyTickets(10);

      // Try to buy more tickets
      await expect(zeroLossLottery.connect(addr1).buyTickets(1))
        .to.be.revertedWith("Exceeds maximum tickets per user");
    });
  });

  describe("Adding interest", function() {
    it("Should allow owner to add interest", async function() {
      // Buy some tickets
      await mockPYUSD.connect(addr1).approve(zeroLossLottery.address, ticketPrice.mul(5));
      await zeroLossLottery.connect(addr1).buyTickets(5);

      // Add interest (10%)
      const interestAmount = ethers.utils.parseEther("0.5"); // 10% of 5 PYUSD
      await mockPYUSD.approve(zeroLossLottery.address, interestAmount);
      await zeroLossLottery.addInterest(10);

      // Check interest pool
      expect(await zeroLossLottery.interestPool()).to.equal(interestAmount);
    });

    it("Should not allow non-owners to add interest", async function() {
      // Buy some tickets
      await mockPYUSD.connect(addr1).approve(zeroLossLottery.address, ticketPrice.mul(5));
      await zeroLossLottery.connect(addr1).buyTickets(5);

      // Try to add interest as non-owner
      await mockPYUSD.connect(addr1).approve(zeroLossLottery.address, ethers.utils.parseEther("0.5"));
      await expect(zeroLossLottery.connect(addr1).addInterest(10))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Drawing winners", function() {
    beforeEach(async function() {
      // Buy tickets
      await mockPYUSD.connect(addr1).approve(zeroLossLottery.address, ticketPrice.mul(3));
      await zeroLossLottery.connect(addr1).buyTickets(3);

      await mockPYUSD.connect(addr2).approve(zeroLossLottery.address, ticketPrice.mul(4));
      await zeroLossLottery.connect(addr2).buyTickets(4);

      // Add interest
      const interestAmount = ethers.utils.parseEther("1"); // 10% of 10 PYUSD
      await mockPYUSD.approve(zeroLossLottery.address, interestAmount);
      await zeroLossLottery.addInterest(10);
    });

    it("Should allow owner to draw winners", async function() {
      // Draw winners
      await zeroLossLottery.drawWinners(123456);

      // Check draw status
      expect(await zeroLossLottery.drawCompleted()).to.equal(true);
      
      // Check that two different winners were selected
      const winner1 = await zeroLossLottery.winners(0);
      const winner2 = await zeroLossLottery.winners(1);
      expect(winner1).to.not.equal(ethers.constants.AddressZero);
      expect(winner2).to.not.equal(ethers.constants.AddressZero);
      expect(winner1).to.not.equal(winner2);
    });

    it("Should not allow non-owners to draw winners", async function() {
      await expect(zeroLossLottery.connect(addr1).drawWinners(123456))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Claiming funds", function() {
    beforeEach(async function() {
      // Buy tickets
      await mockPYUSD.connect(addr1).approve(zeroLossLottery.address, ticketPrice.mul(3));
      await zeroLossLottery.connect(addr1).buyTickets(3);

      await mockPYUSD.connect(addr2).approve(zeroLossLottery.address, ticketPrice.mul(4));
      await zeroLossLottery.connect(addr2).buyTickets(4);

      // Add interest
      const interestAmount = ethers.utils.parseEther("1"); // ~14% of 7 PYUSD
      await mockPYUSD.approve(zeroLossLottery.address, interestAmount);
      await zeroLossLottery.addInterest(14);

      // Draw winners
      await zeroLossLottery.drawWinners(123456);
    });

    it("Should allow users to claim their funds", async function() {
      // Get initial balances
      const initialBalance1 = await mockPYUSD.balanceOf(addr1.address);
      
      // Claim funds
      await zeroLossLottery.connect(addr1).claimFunds();
      
      // Check that funds were claimed
      const finalBalance1 = await mockPYUSD.balanceOf(addr1.address);
      
      // User should get at least their refund
      expect(finalBalance1.sub(initialBalance1)).to.be.gte(ticketPrice.mul(3));
    });

    it("Should not allow double claiming", async function() {
      // Claim funds
      await zeroLossLottery.connect(addr1).claimFunds();
      
      // Try to claim again
      await expect(zeroLossLottery.connect(addr1).claimFunds())
        .to.be.revertedWith("Already claimed");
    });
  });
});