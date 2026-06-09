// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SafeToken — a deliberately un-ruggable ERC20 (the anti-DarkPepe)
/// @notice Fixed supply minted once at deploy. No owner, no blacklist, no transfer gate,
///         no mint, no holding caps. There is no function any party can call to freeze,
///         seize, or block another address's balance — by construction.
contract SafeToken {
    string public constant name = "SafeToken";
    string public constant symbol = "SAFE";
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 supply) {
        totalSupply = supply;
        balanceOf[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply);
    }

    function transfer(address to, uint256 v) external returns (bool) { return _transfer(msg.sender, to, v); }
    function approve(address s, uint256 v) external returns (bool) {
        allowance[msg.sender][s] = v; emit Approval(msg.sender, s, v); return true;
    }
    function transferFrom(address f, address t, uint256 v) external returns (bool) {
        uint256 a = allowance[f][msg.sender];
        if (a != type(uint256).max) { require(a >= v, "allowance"); allowance[f][msg.sender] = a - v; }
        return _transfer(f, t, v);
    }
    function _transfer(address f, address t, uint256 v) internal returns (bool) {
        require(t != address(0), "zero");
        uint256 b = balanceOf[f]; require(b >= v, "balance");
        unchecked { balanceOf[f] = b - v; }
        balanceOf[t] += v;
        emit Transfer(f, t, v);
        return true;
    }
}
