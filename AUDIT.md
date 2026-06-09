# Audit: `contracts/darthpepe.sol` (`DarkPepe`) is a honeypot template

`DarkPepe` (DEPE) is the widely-copied "memecoin with a blacklist" template. It compiles and
trades, but the deployer keeps three levers that let them trap holders. Runnable proofs are
in [`audit/test/Honeypot.t.sol`](audit/test/Honeypot.t.sol) (`cd audit && forge test`).

## The three rug levers (all `onlyOwner`)

1. **Freeze any holder — `blacklist(addr, true)`.** `_beforeTokenTransfer` does
   `require(!blacklists[to] && !blacklists[from], "Blacklisted")`. After someone buys, the
   owner blacklists them and their bag is frozen — they can't sell *or* receive. This is the
   classic honeypot: you can buy, you can't get out.
   *(test: `test_darkpepe_ownerCanFreezeAnyHolder`)*
2. **Owner-gated trading.** While `uniswapV2Pair == address(0)`, `_beforeTokenTransfer`
   requires `from == owner() || to == owner()` — so only the owner can move tokens until the
   owner decides to "start trading". They can simply never start it.
   *(test: `test_darkpepe_tradingGate_ownerOnly`)*
3. **Buy choke — `setRule(...)`.** When `limited`, buys from the pair must land the buyer in
   `[minHoldingAmount, maxHoldingAmount]`; the owner can set these to make buying impossible.

The owner also mints 100% of supply at deploy and retains ownership. None of this is hidden
or exotic — it's the default shape of a rug. The lesson: **before aping a token, read
`_beforeTokenTransfer`/`_update` and the owner-only functions.** A `blacklist` mapping or a
`tradingEnabled` gate means the deployer can stop you selling.

## The anti-pattern: [`audit/src/SafeToken.sol`](audit/src/SafeToken.sol)

A deliberately un-ruggable ERC20: fixed supply minted once, **no owner, no blacklist, no
transfer gate, no mint, no holding caps**. There is no function any party can call to freeze
or seize a balance — proven by `test_safetoken_holderCannotBeFrozen`. If you want a token
nobody can honeypot, that's the shape: nothing privileged to call.

> Educational. `DarkPepe` is kept as the audited artifact; do not deploy it.
