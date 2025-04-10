// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockPYUSD is ERC20 {
    constructor() ERC20("PayPal USD", "PYUSD") {
        // Mint 1000 PYUSD to the deployer
        _mint(msg.sender, 1000 * 10**18);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}