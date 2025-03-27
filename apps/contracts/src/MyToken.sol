// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./lib/ERC20.sol";

contract MyToken is ERC20 {
    constructor()
    ERC20("MyToken", "MTN", 18)
    {
    }
}