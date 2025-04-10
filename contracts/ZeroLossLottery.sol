// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZeroLossLottery is Ownable {
    // State variables
    IERC20 public pyusd;
    uint256 public ticketPrice = 1 * 10**18; // 1 PYUSD (assuming 18 decimals)
    uint256 public maxTicketsPerUser = 10;
    mapping(address => uint256) public tickets;
    address[] public participants;
    mapping(address => bool) public isParticipant;
    uint256 public totalTickets;
    uint256 public interestPool;
    address[2] public winners;
    bool public drawCompleted;
    mapping(address => bool) public hasClaimed;
    
    // Events
    event TicketsPurchased(address buyer, uint256 numTickets);
    event InterestAdded(uint256 amount);
    event DrawCompleted(address firstWinner, address secondWinner);
    event FundsClaimed(address user, uint256 refundAmount, uint256 prizeAmount);
    
    constructor(address _pyusdAddress) {
        pyusd = IERC20(_pyusdAddress);
    }
    
    // Function to buy lottery tickets
    function buyTickets(uint256 numTickets) external {
        require(!drawCompleted, "Draw already completed");
        require(numTickets > 0, "Must buy at least one ticket");
        require(tickets[msg.sender] + numTickets <= maxTicketsPerUser, "Exceeds maximum tickets per user");
        
        uint256 totalCost = numTickets * ticketPrice;
        require(pyusd.balanceOf(msg.sender) >= totalCost, "Insufficient PYUSD balance");
        
        // Transfer PYUSD from user to contract
        bool success = pyusd.transferFrom(msg.sender, address(this), totalCost);
        require(success, "PYUSD transfer failed");
        
        // Update user's ticket count
        tickets[msg.sender] += numTickets;
        
        // Add user to participants array if first purchase
        if (!isParticipant[msg.sender]) {
            participants.push(msg.sender);
            isParticipant[msg.sender] = true;
        }
        
        // Update total tickets
        totalTickets += numTickets;
        
        emit TicketsPurchased(msg.sender, numTickets);
    }
    
    // Function for admin to add interest to the pool
    function addInterest(uint256 percentage) external onlyOwner {
        require(totalTickets > 0, "No tickets sold yet");
        require(percentage > 0, "Percentage must be greater than zero");
        
        uint256 interestAmount = (totalTickets * ticketPrice * percentage) / 100;
        require(pyusd.balanceOf(msg.sender) >= interestAmount, "Insufficient admin PYUSD balance");
        
        // Transfer interest from admin to contract
        bool success = pyusd.transferFrom(msg.sender, address(this), interestAmount);
        require(success, "Interest transfer failed");
        
        // Update interest pool
        interestPool += interestAmount;
        
        emit InterestAdded(interestAmount);
    }
    
    // Function to draw winners
    function drawWinners(uint256 seed) external onlyOwner {
        require(!drawCompleted, "Draw already completed");
        require(participants.length >= 2, "Need at least two participants");
        require(interestPool > 0, "Interest pool is empty");
        
        // Select first winner
        uint256 firstWinnerIndex = uint256(keccak256(abi.encodePacked(seed, block.timestamp))) % participants.length;
        winners[0] = participants[firstWinnerIndex];
        
        // Select second winner (ensure it's different from first)
        uint256 secondWinnerIndex;
        do {
            secondWinnerIndex = uint256(keccak256(abi.encodePacked(seed, block.timestamp, firstWinnerIndex))) % participants.length;
        } while (secondWinnerIndex == firstWinnerIndex);
        
        winners[1] = participants[secondWinnerIndex];
        
        // Mark draw as completed
        drawCompleted = true;
        
        emit DrawCompleted(winners[0], winners[1]);
    }
    
    // Function for users to claim their funds
    function claimFunds() external {
        require(drawCompleted, "Draw not completed yet");
        require(tickets[msg.sender] > 0, "No tickets to claim");
        require(!hasClaimed[msg.sender], "Already claimed");
        
        uint256 refundAmount = tickets[msg.sender] * ticketPrice;
        uint256 prizeAmount = 0;
        
        // Calculate prize if user is a winner
        if (msg.sender == winners[0]) {
            // First place: 50% of interest
            prizeAmount = (interestPool * 50) / 100;
        } else if (msg.sender == winners[1]) {
            // Second place: 30% of interest
            prizeAmount = (interestPool * 30) / 100;
        }
        
        // Mark as claimed
        hasClaimed[msg.sender] = true;
        
        // Transfer refund and prize
        bool refundSuccess = pyusd.transfer(msg.sender, refundAmount);
        require(refundSuccess, "Refund transfer failed");
        
        if (prizeAmount > 0) {
            bool prizeSuccess = pyusd.transfer(msg.sender, prizeAmount);
            require(prizeSuccess, "Prize transfer failed");
        }
        
        emit FundsClaimed(msg.sender, refundAmount, prizeAmount);
    }
    
    // Function for owner to claim platform fee (20% of interest)
    function claimPlatformFee() external onlyOwner {
        require(drawCompleted, "Draw not completed yet");
        
        uint256 platformFee = (interestPool * 20) / 100;
        require(platformFee > 0, "No platform fee to claim");
        
        bool success = pyusd.transfer(owner(), platformFee);
        require(success, "Platform fee transfer failed");
        
        // Reset contract for next lottery round
        resetLottery();
    }
    
    // Reset lottery for next round
    function resetLottery() internal {
        // Reset state variables
        for (uint256 i = 0; i < participants.length; i++) {
            tickets[participants[i]] = 0;
            isParticipant[participants[i]] = false;
            hasClaimed[participants[i]] = false;
        }
        
        delete participants;
        totalTickets = 0;
        interestPool = 0;
        drawCompleted = false;
        delete winners;
    }
    
    // Function to get all participants
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }
    
    // Function to check if a user is a winner
    function isWinner(address user) external view returns (uint8) {
        if (user == winners[0]) return 1; // First place
        if (user == winners[1]) return 2; // Second place
        return 0; // Not a winner
    }
}