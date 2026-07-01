// Generated from Kyd/Event.daml
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
import * as Kyd_Ticket from '../../Kyd/Ticket/module';

export declare type PurchaseOrder_Reject = {
};

export declare const PurchaseOrder_Reject:
  damlTypes.Serializable<PurchaseOrder_Reject> & {
  }
;


export declare type PurchaseOrder_Cancel = {
};

export declare const PurchaseOrder_Cancel:
  damlTypes.Serializable<PurchaseOrder_Cancel> & {
  }
;


export declare type PurchaseOrder_Fill = {
  allocationCid: damlTypes.ContractId<TierAllocation>;
};

export declare const PurchaseOrder_Fill:
  damlTypes.Serializable<PurchaseOrder_Fill> & {
  }
;


export declare type PurchaseOrder = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  fan: damlTypes.Party;
  eventId: string;
  tierId: string;
  cashCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare interface PurchaseOrderInterface {
  PurchaseOrder_Fill: damlTypes.Choice<PurchaseOrder, PurchaseOrder_Fill, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.Optional<damlTypes.ContractId<TierAllocation>>, damlTypes.ContractId<Kyd_Ticket.Ticket>>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PurchaseOrder, undefined>>;
  PurchaseOrder_Cancel: damlTypes.Choice<PurchaseOrder, PurchaseOrder_Cancel, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PurchaseOrder, undefined>>;
  Archive: damlTypes.Choice<PurchaseOrder, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PurchaseOrder, undefined>>;
  PurchaseOrder_Reject: damlTypes.Choice<PurchaseOrder, PurchaseOrder_Reject, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PurchaseOrder, undefined>>;
}
export declare const PurchaseOrder:
  damlTypes.Template<PurchaseOrder, undefined, '#kyd-tix:Kyd.Event:PurchaseOrder'> &
  damlTypes.ToInterface<PurchaseOrder, never> &
  PurchaseOrderInterface;

export declare namespace PurchaseOrder {
  export type CreateEvent = damlLedger.CreateEvent<PurchaseOrder, undefined, typeof PurchaseOrder.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<PurchaseOrder, typeof PurchaseOrder.templateId>
  export type Event = damlLedger.Event<PurchaseOrder, undefined, typeof PurchaseOrder.templateId>
  export type QueryResult = damlLedger.QueryResult<PurchaseOrder, undefined, typeof PurchaseOrder.templateId>
}



export declare type Allocation_Reprice = {
  repricer: damlTypes.Party;
  newPrice: damlTypes.Numeric;
};

export declare const Allocation_Reprice:
  damlTypes.Serializable<Allocation_Reprice> & {
  }
;


export declare type Allocation_IssuePaid = {
  fan: damlTypes.Party;
  paymentCid: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare const Allocation_IssuePaid:
  damlTypes.Serializable<Allocation_IssuePaid> & {
  }
;


export declare type Allocation_Issue = {
  fan: damlTypes.Party;
};

export declare const Allocation_Issue:
  damlTypes.Serializable<Allocation_Issue> & {
  }
;


export declare type TierAllocation = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  artist: damlTypes.Party;
  eventId: string;
  eventTime: damlTypes.Time;
  tierId: string;
  price: damlTypes.Numeric;
  resaleCapBps: damlTypes.Int;
  royaltyBps: damlTypes.Int;
  financingShareBps: damlTypes.Int;
  serialBase: damlTypes.Int;
  size: damlTypes.Int;
  sold: damlTypes.Int;
};

export declare interface TierAllocationInterface {
  Allocation_IssuePaid: damlTypes.Choice<TierAllocation, Allocation_IssuePaid, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.Optional<damlTypes.ContractId<TierAllocation>>, damlTypes.ContractId<Kyd_Ticket.Ticket>>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TierAllocation, undefined>>;
  Allocation_Issue: damlTypes.Choice<TierAllocation, Allocation_Issue, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.Optional<damlTypes.ContractId<TierAllocation>>, damlTypes.ContractId<Kyd_Ticket.Ticket>>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TierAllocation, undefined>>;
  Allocation_Reprice: damlTypes.Choice<TierAllocation, Allocation_Reprice, damlTypes.ContractId<TierAllocation>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TierAllocation, undefined>>;
  Archive: damlTypes.Choice<TierAllocation, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TierAllocation, undefined>>;
}
export declare const TierAllocation:
  damlTypes.Template<TierAllocation, undefined, '#kyd-tix:Kyd.Event:TierAllocation'> &
  damlTypes.ToInterface<TierAllocation, never> &
  TierAllocationInterface;

export declare namespace TierAllocation {
  export type CreateEvent = damlLedger.CreateEvent<TierAllocation, undefined, typeof TierAllocation.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<TierAllocation, typeof TierAllocation.templateId>
  export type Event = damlLedger.Event<TierAllocation, undefined, typeof TierAllocation.templateId>
  export type QueryResult = damlLedger.QueryResult<TierAllocation, undefined, typeof TierAllocation.templateId>
}



export declare type Event_SetTierBasePrice = {
  repricer: damlTypes.Party;
  tierId: string;
  newBasePrice: damlTypes.Numeric;
};

export declare const Event_SetTierBasePrice:
  damlTypes.Serializable<Event_SetTierBasePrice> & {
  }
;


export declare type Event_OpenAllocation = {
  tierId: string;
  size: damlTypes.Int;
};

export declare const Event_OpenAllocation:
  damlTypes.Serializable<Event_OpenAllocation> & {
  }
;


export declare type Event = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  artist: damlTypes.Party;
  eventId: string;
  name: string;
  eventTime: damlTypes.Time;
  royaltyBps: damlTypes.Int;
  financingShareBps: damlTypes.Int;
  tiers: Tier[];
};

export declare interface EventInterface {
  Event_OpenAllocation: damlTypes.Choice<Event, Event_OpenAllocation, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.ContractId<Event>, damlTypes.ContractId<TierAllocation>>, Event.Key> & damlTypes.ChoiceFrom<damlTypes.Template<Event, Event.Key>>;
  Event_SetTierBasePrice: damlTypes.Choice<Event, Event_SetTierBasePrice, damlTypes.ContractId<Event>, Event.Key> & damlTypes.ChoiceFrom<damlTypes.Template<Event, Event.Key>>;
  Archive: damlTypes.Choice<Event, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, Event.Key> & damlTypes.ChoiceFrom<damlTypes.Template<Event, Event.Key>>;
}
export declare const Event:
  damlTypes.Template<Event, Event.Key, '#kyd-tix:Kyd.Event:Event'> &
  damlTypes.ToInterface<Event, never> &
  EventInterface;

export declare namespace Event {
  export type Key = pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.Party, string>
  export type CreateEvent = damlLedger.CreateEvent<Event, Event.Key, typeof Event.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<Event, typeof Event.templateId>
  export type Event = damlLedger.Event<Event, Event.Key, typeof Event.templateId>
  export type QueryResult = damlLedger.QueryResult<Event, Event.Key, typeof Event.templateId>
}



export declare type Tier = {
  tierId: string;
  basePrice: damlTypes.Numeric;
  demandBps: damlTypes.Int;
  resaleCapBps: damlTypes.Int;
  supply: damlTypes.Int;
  allocated: damlTypes.Int;
};

export declare const Tier:
  damlTypes.Serializable<Tier> & {
  }
;

