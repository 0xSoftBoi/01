/// A SOLVENT rebuild of crypto_index_fund::index_fund.
///
/// The original recorded a notional BTC/ETH/XRP/ADA/MATIC basket but the pool only ever held
/// SUI, and `withdraw` paid out the basket's *current* USD value in SUI from the shared pool.
/// Any price move made it insolvent: early withdrawers drained the pool, later ones hit a
/// hard abort in `balance::split` (a bank run, by construction). See ../../../AUDIT.md.
///
/// This version is a pro-rata SHARE fund: you always receive exactly your share of what the
/// pool actually holds, so it can never promise SUI it doesn't have. The oracle is used only
/// for an *informational* USD NAV view (with a staleness guard). NOTE: this is therefore a
/// SUI pool with NAV reporting, not true basket exposure — a real index fund must CUSTODY the
/// assets (swap SUI -> wBTC/wETH/... via a DEX), which is out of scope here. That custody is
/// exactly what the original lacked, which is why it was insolvent.
module index_fund::index_fund {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use index_fund::mock_oracle::{Self, OracleHolder};

    const E_ZERO_DEPOSIT: u64 = 1;
    const E_ZERO_SHARES: u64 = 2;
    const E_TOO_MANY_SHARES: u64 = 3;
    const E_STALE_PRICE: u64 = 4;

    const SUI_USD_PAIR: u32 = 90;
    const MAX_PRICE_AGE: u64 = 300; // seconds

    public struct Fund has key {
        id: UID,
        pool: Balance<SUI>,
        total_shares: u128,
    }

    /// A holder's pro-rata claim on the pool.
    public struct Shares has key, store {
        id: UID,
        amount: u128,
    }

    public struct Deposited has copy, drop { sui_in: u64, shares_out: u128 }
    public struct Withdrawn has copy, drop { shares_in: u128, sui_out: u64 }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Fund { id: object::new(ctx), pool: balance::zero(), total_shares: 0 });
    }

    /// Deposit SUI; mint shares proportional to the existing pool (first deposit is 1:1).
    public entry fun deposit(fund: &mut Fund, payment: Coin<SUI>, ctx: &mut TxContext) {
        let amount = coin::value(&payment);
        assert!(amount > 0, E_ZERO_DEPOSIT);

        let pool_before = balance::value(&fund.pool);
        let shares = if (fund.total_shares == 0 || pool_before == 0) {
            (amount as u128)
        } else {
            (amount as u128) * fund.total_shares / (pool_before as u128)
        };

        balance::join(&mut fund.pool, coin::into_balance(payment));
        fund.total_shares = fund.total_shares + shares;

        event::emit(Deposited { sui_in: amount, shares_out: shares });
        transfer::public_transfer(Shares { id: object::new(ctx), amount: shares }, ctx.sender());
    }

    /// Burn shares for a pro-rata slice of the pool. `sui_out = pool * shares / total_shares`
    /// is always <= pool, so this can never abort for insufficient balance — the fix.
    public entry fun withdraw(fund: &mut Fund, shares: Shares, ctx: &mut TxContext) {
        let Shares { id, amount } = shares;
        object::delete(id);
        assert!(amount > 0, E_ZERO_SHARES);
        assert!(amount <= fund.total_shares, E_TOO_MANY_SHARES);

        let pool = balance::value(&fund.pool);
        let sui_out = (((pool as u128) * amount) / fund.total_shares) as u64;
        fund.total_shares = fund.total_shares - amount;

        let out = coin::from_balance(balance::split(&mut fund.pool, sui_out), ctx);
        event::emit(Withdrawn { shares_in: amount, sui_out });
        transfer::public_transfer(out, ctx.sender());
    }

    /// Informational USD NAV of the pool (9-decimal price), guarded against stale oracle data.
    public fun nav_usd(fund: &Fund, oracle: &OracleHolder): u128 {
        let (price, _decimal, ts, _round) = mock_oracle::get_price(oracle, SUI_USD_PAIR);
        assert!(mock_oracle::now(oracle) - ts <= MAX_PRICE_AGE, E_STALE_PRICE);
        (balance::value(&fund.pool) as u128) * price / 1_000_000_000
    }

    public fun pool_value(fund: &Fund): u64 { balance::value(&fund.pool) }
    public fun total_shares(fund: &Fund): u128 { fund.total_shares }
    public fun shares_amount(s: &Shares): u128 { s.amount }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
}
