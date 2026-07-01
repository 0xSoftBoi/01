// Generated from Kyd/Ticket.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900 from '@kyd/splice-api-token-vendored-1.0.0';
import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

import * as Kyd_Cash from '../../Kyd/Cash/module';

export declare type DvPResale_Withdraw = {
};

export declare const DvPResale_Withdraw:
  damlTypes.Serializable<DvPResale_Withdraw> & {
  }
;


export declare type DvPResale_Reject = {
};

export declare const DvPResale_Reject:
  damlTypes.Serializable<DvPResale_Reject> & {
  }
;


export declare type DvPResale_Settle = {
  sellerLegCid: damlTypes.ContractId<pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation>;
  royaltyLegCid: damlTypes.Optional<damlTypes.ContractId<pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation>>;
  royaltyAccountCid: damlTypes.Optional<damlTypes.ContractId<RoyaltyAccount>>;
  extraArgs: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.MetadataV1.ExtraArgs;
};

export declare const DvPResale_Settle:
  damlTypes.Serializable<DvPResale_Settle> & {
  }
;


export declare type DvPResaleOffer = {
  ticket: Ticket;
  buyer: damlTypes.Party;
  salePrice: damlTypes.Numeric;
  paymentInstrument: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.InstrumentId;
  settlementRef: string;
};

export declare interface DvPResaleOfferInterface {
  DvPResale_Settle: damlTypes.Choice<DvPResaleOffer, DvPResale_Settle, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<DvPResaleOffer, undefined>>;
  DvPResale_Reject: damlTypes.Choice<DvPResaleOffer, DvPResale_Reject, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<DvPResaleOffer, undefined>>;
  Archive: damlTypes.Choice<DvPResaleOffer, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<DvPResaleOffer, undefined>>;
  DvPResale_Withdraw: damlTypes.Choice<DvPResaleOffer, DvPResale_Withdraw, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<DvPResaleOffer, undefined>>;
}
export declare const DvPResaleOffer:
  damlTypes.Template<DvPResaleOffer, undefined, '#kyd-tix:Kyd.Ticket:DvPResaleOffer'> &
  damlTypes.ToInterface<DvPResaleOffer, never> &
  DvPResaleOfferInterface;

export declare namespace DvPResaleOffer {
  export type CreateEvent = damlLedger.CreateEvent<DvPResaleOffer, undefined, typeof DvPResaleOffer.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<DvPResaleOffer, typeof DvPResaleOffer.templateId>
  export type Event = damlLedger.Event<DvPResaleOffer, undefined, typeof DvPResaleOffer.templateId>
  export type QueryResult = damlLedger.QueryResult<DvPResaleOffer, undefined, typeof DvPResaleOffer.templateId>
}



export declare type RoyaltyAccount_CollectLeg = {
  legCid: damlTypes.ContractId<pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation>;
  payer: damlTypes.Party;
  extraArgs: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.MetadataV1.ExtraArgs;
};

export declare const RoyaltyAccount_CollectLeg:
  damlTypes.Serializable<RoyaltyAccount_CollectLeg> & {
  }
;


export declare type RoyaltyAccount = {
  operator: damlTypes.Party;
  artist: damlTypes.Party;
};

export declare interface RoyaltyAccountInterface {
  RoyaltyAccount_CollectLeg: damlTypes.Choice<RoyaltyAccount, RoyaltyAccount_CollectLeg, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation_ExecuteTransferResult, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<RoyaltyAccount, undefined>>;
  Archive: damlTypes.Choice<RoyaltyAccount, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<RoyaltyAccount, undefined>>;
}
export declare const RoyaltyAccount:
  damlTypes.Template<RoyaltyAccount, undefined, '#kyd-tix:Kyd.Ticket:RoyaltyAccount'> &
  damlTypes.ToInterface<RoyaltyAccount, never> &
  RoyaltyAccountInterface;

export declare namespace RoyaltyAccount {
  export type CreateEvent = damlLedger.CreateEvent<RoyaltyAccount, undefined, typeof RoyaltyAccount.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<RoyaltyAccount, typeof RoyaltyAccount.templateId>
  export type Event = damlLedger.Event<RoyaltyAccount, undefined, typeof RoyaltyAccount.templateId>
  export type QueryResult = damlLedger.QueryResult<RoyaltyAccount, undefined, typeof RoyaltyAccount.templateId>
}



export declare type GiftOffer_Withdraw = {
};

export declare const GiftOffer_Withdraw:
  damlTypes.Serializable<GiftOffer_Withdraw> & {
  }
;


export declare type GiftOffer_Decline = {
};

export declare const GiftOffer_Decline:
  damlTypes.Serializable<GiftOffer_Decline> & {
  }
;


export declare type GiftOffer_Accept = {
};

export declare const GiftOffer_Accept:
  damlTypes.Serializable<GiftOffer_Accept> & {
  }
;


export declare type GiftOffer = {
  ticket: Ticket;
  recipient: damlTypes.Party;
};

export declare interface GiftOfferInterface {
  GiftOffer_Accept: damlTypes.Choice<GiftOffer, GiftOffer_Accept, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<GiftOffer, undefined>>;
  GiftOffer_Decline: damlTypes.Choice<GiftOffer, GiftOffer_Decline, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<GiftOffer, undefined>>;
  GiftOffer_Withdraw: damlTypes.Choice<GiftOffer, GiftOffer_Withdraw, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<GiftOffer, undefined>>;
  Archive: damlTypes.Choice<GiftOffer, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<GiftOffer, undefined>>;
}
export declare const GiftOffer:
  damlTypes.Template<GiftOffer, undefined, '#kyd-tix:Kyd.Ticket:GiftOffer'> &
  damlTypes.ToInterface<GiftOffer, never> &
  GiftOfferInterface;

export declare namespace GiftOffer {
  export type CreateEvent = damlLedger.CreateEvent<GiftOffer, undefined, typeof GiftOffer.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<GiftOffer, typeof GiftOffer.templateId>
  export type Event = damlLedger.Event<GiftOffer, undefined, typeof GiftOffer.templateId>
  export type QueryResult = damlLedger.QueryResult<GiftOffer, undefined, typeof GiftOffer.templateId>
}



export declare type ResaleOffer_Withdraw = {
};

export declare const ResaleOffer_Withdraw:
  damlTypes.Serializable<ResaleOffer_Withdraw> & {
  }
;


export declare type ResaleOffer_Reject = {
};

export declare const ResaleOffer_Reject:
  damlTypes.Serializable<ResaleOffer_Reject> & {
  }
;


export declare type ResaleOffer_Accept = {
  cashCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const ResaleOffer_Accept:
  damlTypes.Serializable<ResaleOffer_Accept> & {
  }
;


export declare type ResaleOffer = {
  ticket: Ticket;
  buyer: damlTypes.Party;
  salePrice: damlTypes.Numeric;
};

export declare interface ResaleOfferInterface {
  ResaleOffer_Accept: damlTypes.Choice<ResaleOffer, ResaleOffer_Accept, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ResaleOffer, undefined>>;
  ResaleOffer_Reject: damlTypes.Choice<ResaleOffer, ResaleOffer_Reject, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ResaleOffer, undefined>>;
  ResaleOffer_Withdraw: damlTypes.Choice<ResaleOffer, ResaleOffer_Withdraw, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ResaleOffer, undefined>>;
  Archive: damlTypes.Choice<ResaleOffer, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ResaleOffer, undefined>>;
}
export declare const ResaleOffer:
  damlTypes.Template<ResaleOffer, undefined, '#kyd-tix:Kyd.Ticket:ResaleOffer'> &
  damlTypes.ToInterface<ResaleOffer, never> &
  ResaleOfferInterface;

export declare namespace ResaleOffer {
  export type CreateEvent = damlLedger.CreateEvent<ResaleOffer, undefined, typeof ResaleOffer.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<ResaleOffer, typeof ResaleOffer.templateId>
  export type Event = damlLedger.Event<ResaleOffer, undefined, typeof ResaleOffer.templateId>
  export type QueryResult = damlLedger.QueryResult<ResaleOffer, undefined, typeof ResaleOffer.templateId>
}



export declare type Ticket_OfferDvP = {
  buyer: damlTypes.Party;
  salePrice: damlTypes.Numeric;
  paymentInstrument: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.InstrumentId;
  settlementRef: string;
};

export declare const Ticket_OfferDvP:
  damlTypes.Serializable<Ticket_OfferDvP> & {
  }
;


export declare type Ticket_Refund = {
  cashCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const Ticket_Refund:
  damlTypes.Serializable<Ticket_Refund> & {
  }
;


export declare type Ticket_OfferGift = {
  recipient: damlTypes.Party;
};

export declare const Ticket_OfferGift:
  damlTypes.Serializable<Ticket_OfferGift> & {
  }
;


export declare type Ticket_Offer = {
  buyer: damlTypes.Party;
  salePrice: damlTypes.Numeric;
};

export declare const Ticket_Offer:
  damlTypes.Serializable<Ticket_Offer> & {
  }
;


export declare type Ticket_CheckIn = {
};

export declare const Ticket_CheckIn:
  damlTypes.Serializable<Ticket_CheckIn> & {
  }
;


export declare type Ticket = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  artist: damlTypes.Party;
  owner: damlTypes.Party;
  eventId: string;
  eventTime: damlTypes.Time;
  tierId: string;
  serial: damlTypes.Int;
  facePrice: damlTypes.Numeric;
  maxResalePrice: damlTypes.Numeric;
  royaltyBps: damlTypes.Int;
  redeemed: boolean;
};

export declare interface TicketInterface {
  Ticket_CheckIn: damlTypes.Choice<Ticket, Ticket_CheckIn, damlTypes.ContractId<Ticket>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Ticket, undefined>>;
  Ticket_Offer: damlTypes.Choice<Ticket, Ticket_Offer, damlTypes.ContractId<ResaleOffer>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Ticket, undefined>>;
  Ticket_OfferGift: damlTypes.Choice<Ticket, Ticket_OfferGift, damlTypes.ContractId<GiftOffer>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Ticket, undefined>>;
  Ticket_Refund: damlTypes.Choice<Ticket, Ticket_Refund, damlTypes.ContractId<Kyd_Cash.Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Ticket, undefined>>;
  Ticket_OfferDvP: damlTypes.Choice<Ticket, Ticket_OfferDvP, damlTypes.ContractId<DvPResaleOffer>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Ticket, undefined>>;
  Archive: damlTypes.Choice<Ticket, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Ticket, undefined>>;
}
export declare const Ticket:
  damlTypes.Template<Ticket, undefined, '#kyd-tix:Kyd.Ticket:Ticket'> &
  damlTypes.ToInterface<Ticket, never> &
  TicketInterface;

export declare namespace Ticket {
  export type CreateEvent = damlLedger.CreateEvent<Ticket, undefined, typeof Ticket.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<Ticket, typeof Ticket.templateId>
  export type Event = damlLedger.Event<Ticket, undefined, typeof Ticket.templateId>
  export type QueryResult = damlLedger.QueryResult<Ticket, undefined, typeof Ticket.templateId>
}


