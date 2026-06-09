// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {DarkPepe} from "../src/DarkPepe.sol";
import {SafeToken} from "../src/SafeToken.sol";

contract HoneypotTest is Test {
    address alice = address(0xA11CE);
    address bob   = address(0xB0B);

    // DarkPepe rug #1: the owner can freeze any holder's bag at will.
    function test_darkpepe_ownerCanFreezeAnyHolder() public {
        DarkPepe t = new DarkPepe(1_000_000 ether);
        t.setRule(false, address(0xDEAD), 0, 0); // pair != 0 -> "trading started"
        t.transfer(alice, 1000 ether);
        vm.prank(alice); t.transfer(bob, 1 ether); // alice can sell... for now

        t.blacklist(alice, true);                  // owner freezes alice
        vm.prank(alice);
        vm.expectRevert("Blacklisted");
        t.transfer(bob, 1 ether);                  // she can no longer move her bag
        vm.expectRevert("Blacklisted");
        t.transfer(alice, 1 ether);                // and can't even receive
    }

    // DarkPepe rug #2: until the owner opens trading, only the owner can move tokens.
    function test_darkpepe_tradingGate_ownerOnly() public {
        DarkPepe t = new DarkPepe(1_000_000 ether);
        t.transfer(alice, 1000 ether);             // owner -> alice ok
        vm.prank(alice);
        vm.expectRevert("trading is not started"); // alice can't pass it on
        t.transfer(bob, 1 ether);
    }

    // SafeToken: no owner, no blacklist, no gate — a holder can always move their bag.
    function test_safetoken_holderCannotBeFrozen() public {
        SafeToken s = new SafeToken(1_000_000 ether);
        s.transfer(alice, 1000 ether);
        vm.prank(alice);
        assertTrue(s.transfer(bob, 1000 ether));
        assertEq(s.balanceOf(bob), 1000 ether);
    }
}
