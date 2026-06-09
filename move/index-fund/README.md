# index-fund — audit + a solvent rebuild

The original `crypto_index_fund::index_fund` (in `../../contracts/`) is a Sui Move "crypto
index fund": deposit SUI → mint an `IndexFundToken` recording a notional equal-weighted
basket (BTC/ETH/XRP/ADA/MATIC via the Supra oracle); withdraw → burn it, get SUI back. It is
**insolvent by construction**.

## The bugs

1. **Insolvent by construction (critical).** The pool only ever holds **SUI**. But
   `withdraw_investment` values the token's *notional* basket at *current* oracle prices and
   pays that many SUI out of the shared pool:
   ```move
   let total_sui: u64 = ((total_usd_value / adjusted_sui_usd_price) as u64);
   let index_token_balance = balance::split(&mut index_fund.balance, total_sui);
   ```
   The fund never bought BTC/ETH/…, so it can't honour basket gains. If prices rise, early
   withdrawers pull out **more SUI than they put in**, draining the pool; the next withdrawer
   hits a hard `balance::split` abort and their funds are stuck. A bank run, by design.
2. **Tangled decimals / precision loss.** `deposit_amount_usd = sui_usd_price_9dec * mist`,
   then `/ 5` and `/ crypto_price` — the units don't cleanly cancel and integer truncation
   leaks value (small deposits can record 0 basket units).
3. **No oracle staleness check.** `extract_price`'s timestamp/round are ignored, so a stale
   price is trusted; the SUI/USD pair index `90` is a magic number; no events.

## The fix (`sources/index_fund.move`)

A **pro-rata share fund**: `deposit` mints shares proportional to the pool (first deposit
1:1); `withdraw` returns `pool * shares / total_shares` SUI — always ≤ the pool, so it can
**never** abort for insufficient balance and never promises SUI it doesn't hold. The oracle
becomes an **informational USD NAV** view with a **staleness guard**; events on both paths.

**Honest limit:** this is a solvent SUI pool with NAV reporting, *not* true basket exposure.
A real index fund must **custody** the assets (swap SUI → wBTC/wETH/… via a DEX) — exactly
what the original lacked, which is the root cause of its insolvency.

## Run

```bash
sui move test   # 5 tests: deposit/withdraw pro-rata, two-depositor solvency (the fix),
                # proportional shares, oracle NAV, stale-price rejection
```
`sources/mock_oracle.move` stands in for the Supra oracle so this builds/tests standalone.
Educational; not audited.
