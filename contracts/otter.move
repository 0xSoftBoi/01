module fungible_tokens::supra {
    use std::option;
    use sui::coin;
    use sui::transfers;
    use sui::tx_context::{Self, TxContext};


    //Names matches the module name, but in UPPERCASE
    struct OTTER has drop{}

    //Module initializer is called once on module publish
    //a treasury cap is sento the publisher, who then controls minting and burning. 

    fun init(witness: OTTER, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(witness, 9, b"OTT", b"OTTER", b"", option::none(), ctx);
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, tx_context::sender(ctx))
    }

    //Manager can mint new OTTER tokens
    public entry fun mint(
        treasury: &mut coin::TreasuryCap<OTTER>, amount: u64, recipient: address, ctx: &mut TxContext
    ) {
        coin::mint_and_transfer(treasury, amount, recipient, ctx)
    }

    // Manager can burn OTTER tokens
    public entry fun burn(treasury: &mut coin::TreasuryCap<OTTER>, coin: coin::Coin<OTTER>) {
        coin::burn(treasury, coin);
        
    }

)
}