// Generated from Kyd/Settlement.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

import * as Kyd_Cash from '../../Kyd/Cash/module';

export declare type Receipt_Refund = {
};

export declare const Receipt_Refund:
  damlTypes.Serializable<Receipt_Refund> & {
  }
;


export declare type Receipt_Release = {
};

export declare const Receipt_Release:
  damlTypes.Serializable<Receipt_Release> & {
  }
;


export declare type RevenueShare = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  eventId: string;
  amount: damlTypes.Numeric;
  locked: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare interface RevenueShareInterface {
  Receipt_Release: damlTypes.Choice<RevenueShare, Receipt_Release, damlTypes.ContractId<Kyd_Cash.Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<RevenueShare, undefined>>;
  Receipt_Refund: damlTypes.Choice<RevenueShare, Receipt_Refund, damlTypes.ContractId<Kyd_Cash.Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<RevenueShare, undefined>>;
  Archive: damlTypes.Choice<RevenueShare, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<RevenueShare, undefined>>;
}
export declare const RevenueShare:
  damlTypes.Template<RevenueShare, undefined, '#kyd-tix:Kyd.Settlement:RevenueShare'> &
  damlTypes.ToInterface<RevenueShare, never> &
  RevenueShareInterface;

export declare namespace RevenueShare {
  export type CreateEvent = damlLedger.CreateEvent<RevenueShare, undefined, typeof RevenueShare.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<RevenueShare, typeof RevenueShare.templateId>
  export type Event = damlLedger.Event<RevenueShare, undefined, typeof RevenueShare.templateId>
  export type QueryResult = damlLedger.QueryResult<RevenueShare, undefined, typeof RevenueShare.templateId>
}


