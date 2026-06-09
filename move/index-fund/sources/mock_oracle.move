/// A minimal stand-in for the Supra oracle surface the original module used
/// (`OracleHolder`, `Price`, `get_price`, `get_prices`, `extract_price`), so the fund
/// builds and tests without the real Supra dependency. Prices are settable in tests.
module index_fund::mock_oracle {
    use sui::table::{Self, Table};

    public struct OracleHolder has key, store {
        id: UID,
        prices: Table<u32, PriceData>,
        now: u64,
    }

    public struct PriceData has store, copy, drop { value: u128, decimal: u16, timestamp: u64, round: u64 }
    public struct Price has copy, drop { pair: u32, value: u128, decimal: u16, timestamp: u64, round: u64 }

    public fun new(now: u64, ctx: &mut TxContext): OracleHolder {
        OracleHolder { id: object::new(ctx), prices: table::new(ctx), now }
    }

    public fun set_price(h: &mut OracleHolder, pair: u32, value: u128, decimal: u16, timestamp: u64) {
        if (table::contains(&h.prices, pair)) { let _ = table::remove(&mut h.prices, pair); };
        table::add(&mut h.prices, pair, PriceData { value, decimal, timestamp, round: 1 });
    }

    public fun set_now(h: &mut OracleHolder, now: u64) { h.now = now; }
    public fun now(h: &OracleHolder): u64 { h.now }

    /// returns (value, decimal, timestamp, round)
    public fun get_price(h: &OracleHolder, pair: u32): (u128, u16, u64, u64) {
        let p = table::borrow(&h.prices, pair);
        (p.value, p.decimal, p.timestamp, p.round)
    }

    public fun get_prices(h: &OracleHolder, pairs: vector<u32>): vector<Price> {
        let mut out = vector::empty<Price>();
        let mut i = 0;
        while (i < vector::length(&pairs)) {
            let pair = *vector::borrow(&pairs, i);
            let p = table::borrow(&h.prices, pair);
            vector::push_back(&mut out, Price { pair, value: p.value, decimal: p.decimal, timestamp: p.timestamp, round: p.round });
            i = i + 1;
        };
        out
    }

    public fun extract_price(p: &Price): (u32, u128, u16, u64, u64) {
        (p.pair, p.value, p.decimal, p.timestamp, p.round)
    }

    #[test_only]
    public fun destroy_for_testing(h: OracleHolder) {
        let OracleHolder { id, prices, now: _ } = h;
        table::drop(prices);
        object::delete(id);
    }
}
