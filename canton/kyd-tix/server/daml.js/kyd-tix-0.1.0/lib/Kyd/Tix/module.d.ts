// Generated from Kyd/Tix.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7 from '@kyd/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7';
import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

import * as Kyd_Cash from '../../Kyd/Cash/module';
import * as Kyd_Settlement from '../../Kyd/Settlement/module';

export declare type TrancheOffer_Reject = {
};

export declare const TrancheOffer_Reject:
  damlTypes.Serializable<TrancheOffer_Reject> & {
  }
;


export declare type TrancheOffer_Withdraw = {
};

export declare const TrancheOffer_Withdraw:
  damlTypes.Serializable<TrancheOffer_Withdraw> & {
  }
;


export declare type TrancheOffer_Accept = {
  cashCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const TrancheOffer_Accept:
  damlTypes.Serializable<TrancheOffer_Accept> & {
  }
;


export declare type TrancheOffer = {
  operator: damlTypes.Party;
  eventId: string;
  seller: damlTypes.Party;
  buyer: damlTypes.Party;
  faceAmount: damlTypes.Numeric;
  price: damlTypes.Numeric;
};

export declare interface TrancheOfferInterface {
  TrancheOffer_Accept: damlTypes.Choice<TrancheOffer, TrancheOffer_Accept, damlTypes.ContractId<SyndicatedLoan>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TrancheOffer, undefined>>;
  TrancheOffer_Withdraw: damlTypes.Choice<TrancheOffer, TrancheOffer_Withdraw, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TrancheOffer, undefined>>;
  Archive: damlTypes.Choice<TrancheOffer, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TrancheOffer, undefined>>;
  TrancheOffer_Reject: damlTypes.Choice<TrancheOffer, TrancheOffer_Reject, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TrancheOffer, undefined>>;
}
export declare const TrancheOffer:
  damlTypes.Template<TrancheOffer, undefined, '#kyd-tix:Kyd.Tix:TrancheOffer'> &
  damlTypes.ToInterface<TrancheOffer, never> &
  TrancheOfferInterface;

export declare namespace TrancheOffer {
  export type CreateEvent = damlLedger.CreateEvent<TrancheOffer, undefined, typeof TrancheOffer.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<TrancheOffer, typeof TrancheOffer.templateId>
  export type Event = damlLedger.Event<TrancheOffer, undefined, typeof TrancheOffer.templateId>
  export type QueryResult = damlLedger.QueryResult<TrancheOffer, undefined, typeof TrancheOffer.templateId>
}



export declare type Loan_ExecuteTrancheTransfer = {
  seller: damlTypes.Party;
  buyer: damlTypes.Party;
  faceAmount: damlTypes.Numeric;
};

export declare const Loan_ExecuteTrancheTransfer:
  damlTypes.Serializable<Loan_ExecuteTrancheTransfer> & {
  }
;


export declare type Loan_OfferTranche = {
  seller: damlTypes.Party;
  buyer: damlTypes.Party;
  faceAmount: damlTypes.Numeric;
  price: damlTypes.Numeric;
};

export declare const Loan_OfferTranche:
  damlTypes.Serializable<Loan_OfferTranche> & {
  }
;


export declare type Loan_SweepRevenue = {
  receiptCids: damlTypes.ContractId<Kyd_Settlement.RevenueShare>[];
};

export declare const Loan_SweepRevenue:
  damlTypes.Serializable<Loan_SweepRevenue> & {
  }
;


export declare type Loan_AccrueLateInterest = {
};

export declare const Loan_AccrueLateInterest:
  damlTypes.Serializable<Loan_AccrueLateInterest> & {
  }
;


export declare type Loan_SettleRevenue = {
  revenueCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const Loan_SettleRevenue:
  damlTypes.Serializable<Loan_SettleRevenue> & {
  }
;


export declare type Loan_Distribute = {
  cashCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const Loan_Distribute:
  damlTypes.Serializable<Loan_Distribute> & {
  }
;


export declare type SyndicatedLoan = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  eventId: string;
  revenueShareBps: damlTypes.Int;
  dueDate: damlTypes.Time;
  lateInterestBpsPerDay: damlTypes.Int;
  lastAccrual: damlTypes.Time;
  tranches: Tranche[];
};

export declare interface SyndicatedLoanInterface {
  Loan_SweepRevenue: damlTypes.Choice<SyndicatedLoan, Loan_SweepRevenue, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.Optional<damlTypes.ContractId<SyndicatedLoan>>, damlTypes.Optional<damlTypes.ContractId<Kyd_Cash.Cash>>>, SyndicatedLoan.Key> & damlTypes.ChoiceFrom<damlTypes.Template<SyndicatedLoan, SyndicatedLoan.Key>>;
  Loan_SettleRevenue: damlTypes.Choice<SyndicatedLoan, Loan_SettleRevenue, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.Optional<damlTypes.ContractId<SyndicatedLoan>>, damlTypes.Optional<damlTypes.ContractId<Kyd_Cash.Cash>>>, SyndicatedLoan.Key> & damlTypes.ChoiceFrom<damlTypes.Template<SyndicatedLoan, SyndicatedLoan.Key>>;
  Loan_Distribute: damlTypes.Choice<SyndicatedLoan, Loan_Distribute, damlTypes.Optional<damlTypes.ContractId<SyndicatedLoan>>, SyndicatedLoan.Key> & damlTypes.ChoiceFrom<damlTypes.Template<SyndicatedLoan, SyndicatedLoan.Key>>;
  Loan_AccrueLateInterest: damlTypes.Choice<SyndicatedLoan, Loan_AccrueLateInterest, damlTypes.ContractId<SyndicatedLoan>, SyndicatedLoan.Key> & damlTypes.ChoiceFrom<damlTypes.Template<SyndicatedLoan, SyndicatedLoan.Key>>;
  Loan_OfferTranche: damlTypes.Choice<SyndicatedLoan, Loan_OfferTranche, damlTypes.ContractId<TrancheOffer>, SyndicatedLoan.Key> & damlTypes.ChoiceFrom<damlTypes.Template<SyndicatedLoan, SyndicatedLoan.Key>>;
  Loan_ExecuteTrancheTransfer: damlTypes.Choice<SyndicatedLoan, Loan_ExecuteTrancheTransfer, damlTypes.ContractId<SyndicatedLoan>, SyndicatedLoan.Key> & damlTypes.ChoiceFrom<damlTypes.Template<SyndicatedLoan, SyndicatedLoan.Key>>;
  Archive: damlTypes.Choice<SyndicatedLoan, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, SyndicatedLoan.Key> & damlTypes.ChoiceFrom<damlTypes.Template<SyndicatedLoan, SyndicatedLoan.Key>>;
}
export declare const SyndicatedLoan:
  damlTypes.Template<SyndicatedLoan, SyndicatedLoan.Key, '#kyd-tix:Kyd.Tix:SyndicatedLoan'> &
  damlTypes.ToInterface<SyndicatedLoan, never> &
  SyndicatedLoanInterface;

export declare namespace SyndicatedLoan {
  export type Key = pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.Party, string>
  export type CreateEvent = damlLedger.CreateEvent<SyndicatedLoan, SyndicatedLoan.Key, typeof SyndicatedLoan.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<SyndicatedLoan, typeof SyndicatedLoan.templateId>
  export type Event = damlLedger.Event<SyndicatedLoan, SyndicatedLoan.Key, typeof SyndicatedLoan.templateId>
  export type QueryResult = damlLedger.QueryResult<SyndicatedLoan, SyndicatedLoan.Key, typeof SyndicatedLoan.templateId>
}



export declare type OpenCommitment_SettleToVenue = {
};

export declare const OpenCommitment_SettleToVenue:
  damlTypes.Serializable<OpenCommitment_SettleToVenue> & {
  }
;


export declare type OpenCommitment_Uncommit = {
};

export declare const OpenCommitment_Uncommit:
  damlTypes.Serializable<OpenCommitment_Uncommit> & {
  }
;


export declare type OpenCommitment = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  lender: damlTypes.Party;
  eventId: string;
  amount: damlTypes.Numeric;
  locked: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare interface OpenCommitmentInterface {
  OpenCommitment_Uncommit: damlTypes.Choice<OpenCommitment, OpenCommitment_Uncommit, damlTypes.ContractId<Kyd_Cash.Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<OpenCommitment, undefined>>;
  OpenCommitment_SettleToVenue: damlTypes.Choice<OpenCommitment, OpenCommitment_SettleToVenue, damlTypes.ContractId<Kyd_Cash.Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<OpenCommitment, undefined>>;
  Archive: damlTypes.Choice<OpenCommitment, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<OpenCommitment, undefined>>;
}
export declare const OpenCommitment:
  damlTypes.Template<OpenCommitment, undefined, '#kyd-tix:Kyd.Tix:OpenCommitment'> &
  damlTypes.ToInterface<OpenCommitment, never> &
  OpenCommitmentInterface;

export declare namespace OpenCommitment {
  export type CreateEvent = damlLedger.CreateEvent<OpenCommitment, undefined, typeof OpenCommitment.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<OpenCommitment, typeof OpenCommitment.templateId>
  export type Event = damlLedger.Event<OpenCommitment, undefined, typeof OpenCommitment.templateId>
  export type QueryResult = damlLedger.QueryResult<OpenCommitment, undefined, typeof OpenCommitment.templateId>
}



export declare type Listing_Activate = {
  commitmentCids: damlTypes.ContractId<OpenCommitment>[];
};

export declare const Listing_Activate:
  damlTypes.Serializable<Listing_Activate> & {
  }
;


export declare type Listing_Cancel = {
};

export declare const Listing_Cancel:
  damlTypes.Serializable<Listing_Cancel> & {
  }
;


export declare type Listing_Commit = {
  lender: damlTypes.Party;
  cashCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const Listing_Commit:
  damlTypes.Serializable<Listing_Commit> & {
  }
;


export declare type OpenOfferingListing = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  public: damlTypes.Party;
  eventId: string;
  target: damlTypes.Numeric;
  factorRateBps: damlTypes.Int;
  revenueShareBps: damlTypes.Int;
  dueDate: damlTypes.Time;
  lateInterestBpsPerDay: damlTypes.Int;
  raised: damlTypes.Numeric;
};

export declare interface OpenOfferingListingInterface {
  Listing_Commit: damlTypes.Choice<OpenOfferingListing, Listing_Commit, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.ContractId<OpenOfferingListing>, damlTypes.ContractId<OpenCommitment>>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<OpenOfferingListing, undefined>>;
  Listing_Cancel: damlTypes.Choice<OpenOfferingListing, Listing_Cancel, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<OpenOfferingListing, undefined>>;
  Listing_Activate: damlTypes.Choice<OpenOfferingListing, Listing_Activate, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.ContractId<SyndicatedLoan>, damlTypes.ContractId<Kyd_Cash.Cash>[]>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<OpenOfferingListing, undefined>>;
  Archive: damlTypes.Choice<OpenOfferingListing, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<OpenOfferingListing, undefined>>;
}
export declare const OpenOfferingListing:
  damlTypes.Template<OpenOfferingListing, undefined, '#kyd-tix:Kyd.Tix:OpenOfferingListing'> &
  damlTypes.ToInterface<OpenOfferingListing, never> &
  OpenOfferingListingInterface;

export declare namespace OpenOfferingListing {
  export type CreateEvent = damlLedger.CreateEvent<OpenOfferingListing, undefined, typeof OpenOfferingListing.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<OpenOfferingListing, typeof OpenOfferingListing.templateId>
  export type Event = damlLedger.Event<OpenOfferingListing, undefined, typeof OpenOfferingListing.templateId>
  export type QueryResult = damlLedger.QueryResult<OpenOfferingListing, undefined, typeof OpenOfferingListing.templateId>
}



export declare type Offering_Activate = {
};

export declare const Offering_Activate:
  damlTypes.Serializable<Offering_Activate> & {
  }
;


export declare type Offering_Cancel = {
};

export declare const Offering_Cancel:
  damlTypes.Serializable<Offering_Cancel> & {
  }
;


export declare type Offering_Uncommit = {
  lender: damlTypes.Party;
};

export declare const Offering_Uncommit:
  damlTypes.Serializable<Offering_Uncommit> & {
  }
;


export declare type Offering_Commit = {
  lender: damlTypes.Party;
  cashCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const Offering_Commit:
  damlTypes.Serializable<Offering_Commit> & {
  }
;


export declare type FinancingOffering = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  eventId: string;
  target: damlTypes.Numeric;
  factorRateBps: damlTypes.Int;
  revenueShareBps: damlTypes.Int;
  dueDate: damlTypes.Time;
  lateInterestBpsPerDay: damlTypes.Int;
  invited: damlTypes.Party[];
  commitments: LenderCommitment[];
};

export declare interface FinancingOfferingInterface {
  Offering_Commit: damlTypes.Choice<FinancingOffering, Offering_Commit, damlTypes.ContractId<FinancingOffering>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<FinancingOffering, undefined>>;
  Offering_Cancel: damlTypes.Choice<FinancingOffering, Offering_Cancel, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<FinancingOffering, undefined>>;
  Offering_Uncommit: damlTypes.Choice<FinancingOffering, Offering_Uncommit, damlTypes.ContractId<FinancingOffering>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<FinancingOffering, undefined>>;
  Offering_Activate: damlTypes.Choice<FinancingOffering, Offering_Activate, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.ContractId<SyndicatedLoan>, damlTypes.ContractId<Kyd_Cash.Cash>[]>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<FinancingOffering, undefined>>;
  Archive: damlTypes.Choice<FinancingOffering, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<FinancingOffering, undefined>>;
}
export declare const FinancingOffering:
  damlTypes.Template<FinancingOffering, undefined, '#kyd-tix:Kyd.Tix:FinancingOffering'> &
  damlTypes.ToInterface<FinancingOffering, never> &
  FinancingOfferingInterface;

export declare namespace FinancingOffering {
  export type CreateEvent = damlLedger.CreateEvent<FinancingOffering, undefined, typeof FinancingOffering.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<FinancingOffering, typeof FinancingOffering.templateId>
  export type Event = damlLedger.Event<FinancingOffering, undefined, typeof FinancingOffering.templateId>
  export type QueryResult = damlLedger.QueryResult<FinancingOffering, undefined, typeof FinancingOffering.templateId>
}



export declare type LenderCommitment = {
  lender: damlTypes.Party;
  amount: damlTypes.Numeric;
  locked: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const LenderCommitment:
  damlTypes.Serializable<LenderCommitment> & {
  }
;


export declare type Tranche = {
  lender: damlTypes.Party;
  outstanding: damlTypes.Numeric;
};

export declare const Tranche:
  damlTypes.Serializable<Tranche> & {
  }
;

