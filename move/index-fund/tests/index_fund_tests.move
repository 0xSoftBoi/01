#[test_only]
module index_fund::index_fund_tests {
    use sui::test_scenario as ts;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use index_fund::index_fund::{Self, Fund, Shares};
    use index_fund::mock_oracle;

    const A: address = @0xA;
    const B: address = @0xB;

    fun deposit_as(sc: &mut ts::Scenario, who: address, amt: u64) {
        ts::next_tx(sc, who);
        let mut fund = ts::take_shared<Fund>(sc);
        let c = coin::mint_for_testing<SUI>(amt, ts::ctx(sc));
        index_fund::deposit(&mut fund, c, ts::ctx(sc));
        ts::return_shared(fund);
    }

    fun withdraw_as(sc: &mut ts::Scenario, who: address): u64 {
        ts::next_tx(sc, who);
        let mut fund = ts::take_shared<Fund>(sc);
        let s = ts::take_from_sender<Shares>(sc);
        index_fund::withdraw(&mut fund, s, ts::ctx(sc));
        ts::return_shared(fund);
        ts::next_tx(sc, who);
        let got = ts::take_from_sender<Coin<SUI>>(sc);
        let v = coin::value(&got);
        coin::burn_for_testing(got);
        v
    }

    #[test]
    fun test_deposit_withdraw_roundtrip() {
        let mut sc = ts::begin(A);
        index_fund::init_for_testing(ts::ctx(&mut sc));
        deposit_as(&mut sc, A, 1000);
        assert!(withdraw_as(&mut sc, A) == 1000, 0);
        ts::end(sc);
    }

    // THE FIX: two depositors, both withdraw their pro-rata share with NO abort. The original
    // valued a notional basket at current prices and paid it from the SUI pool, so the second
    // withdrawer would hit a balance::split abort after the first drained it. Here, payouts are
    // pro-rata of what's actually held, so the pool always covers everyone.
    #[test]
    fun test_two_depositors_solvent() {
        let mut sc = ts::begin(A);
        index_fund::init_for_testing(ts::ctx(&mut sc));
        deposit_as(&mut sc, A, 1000);
        deposit_as(&mut sc, B, 1000);     // pool 2000, shares A=1000 B=1000
        assert!(withdraw_as(&mut sc, A) == 1000, 1);  // first out
        assert!(withdraw_as(&mut sc, B) == 1000, 2);  // second out — does NOT abort
        ts::end(sc);
    }

    // shares are proportional to the pool at deposit time
    #[test]
    fun test_proportional_shares() {
        let mut sc = ts::begin(A);
        index_fund::init_for_testing(ts::ctx(&mut sc));
        deposit_as(&mut sc, A, 1000);     // A: 1000 shares, pool 1000
        deposit_as(&mut sc, B, 500);      // B: 500*1000/1000 = 500 shares, pool 1500
        // A owns 1000/1500, B owns 500/1500
        assert!(withdraw_as(&mut sc, A) == 1000, 1); // 1500 * 1000/1500
        assert!(withdraw_as(&mut sc, B) == 500, 2);  // 500 * 500/500
        ts::end(sc);
    }

    // the oracle staleness guard (bug #3 fix)
    #[test]
    fun test_nav_fresh_ok() {
        let mut sc = ts::begin(A);
        index_fund::init_for_testing(ts::ctx(&mut sc));
        deposit_as(&mut sc, A, 1000);
        ts::next_tx(&mut sc, A);
        let fund = ts::take_shared<Fund>(&sc);
        let mut oracle = mock_oracle::new(1000, ts::ctx(&mut sc));
        mock_oracle::set_price(&mut oracle, 90, 2_000_000_000, 9, 900); // SUI=$2, ts=900, now=1000 -> fresh
        let nav = index_fund::nav_usd(&fund, &oracle);
        assert!(nav == 1000 * 2, 0); // pool 1000 * $2 (9-dec) / 1e9
        mock_oracle::destroy_for_testing(oracle);
        ts::return_shared(fund);
        ts::end(sc);
    }

    #[test]
    #[expected_failure]
    fun test_nav_stale_rejected() {
        let mut sc = ts::begin(A);
        index_fund::init_for_testing(ts::ctx(&mut sc));
        deposit_as(&mut sc, A, 1000);
        ts::next_tx(&mut sc, A);
        let fund = ts::take_shared<Fund>(&sc);
        let mut oracle = mock_oracle::new(100000, ts::ctx(&mut sc)); // now far ahead
        mock_oracle::set_price(&mut oracle, 90, 2_000_000_000, 9, 900); // ts=900 -> stale
        let _nav = index_fund::nav_usd(&fund, &oracle); // aborts E_STALE_PRICE
        mock_oracle::destroy_for_testing(oracle);
        ts::return_shared(fund);
        ts::end(sc);
    }
}
