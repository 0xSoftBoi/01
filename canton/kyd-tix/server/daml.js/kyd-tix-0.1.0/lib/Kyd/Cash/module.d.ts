// Generated from Kyd/Cash.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900 from '@kyd/splice-api-token-vendored-1.0.0';
import * as pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7 from '@kyd/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7';
import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

export declare type Cash_SettleLocked = {
  newOwner: damlTypes.Party;
};

export declare const Cash_SettleLocked:
  damlTypes.Serializable<Cash_SettleLocked> & {
  }
;


export declare type Cash_UnlockExpired = {
};

export declare const Cash_UnlockExpired:
  damlTypes.Serializable<Cash_UnlockExpired> & {
  }
;


export declare type Cash_Unlock = {
};

export declare const Cash_Unlock:
  damlTypes.Serializable<Cash_Unlock> & {
  }
;


export declare type Cash_Lock = {
  newLock: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.Lock;
  newLockRecipient: damlTypes.Party;
  newLockCoSigner: damlTypes.Optional<damlTypes.Party>;
};

export declare const Cash_Lock:
  damlTypes.Serializable<Cash_Lock> & {
  }
;


export declare type Cash_Merge = {
  otherCid: damlTypes.ContractId<Cash>;
};

export declare const Cash_Merge:
  damlTypes.Serializable<Cash_Merge> & {
  }
;


export declare type Cash_Split = {
  splitAmount: damlTypes.Numeric;
};

export declare const Cash_Split:
  damlTypes.Serializable<Cash_Split> & {
  }
;


export declare type Cash_Disclose = {
  parties: damlTypes.Party[];
};

export declare const Cash_Disclose:
  damlTypes.Serializable<Cash_Disclose> & {
  }
;


export declare type Cash_Transfer = {
  newOwner: damlTypes.Party;
};

export declare const Cash_Transfer:
  damlTypes.Serializable<Cash_Transfer> & {
  }
;


export declare type Cash = {
  operator: damlTypes.Party;
  owner: damlTypes.Party;
  amount: damlTypes.Numeric;
  lock: damlTypes.Optional<pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.Lock>;
  lockRecipient: damlTypes.Optional<damlTypes.Party>;
  lockCoSigner: damlTypes.Optional<damlTypes.Party>;
  observers: damlTypes.Party[];
};

export declare interface CashInterface {
  Archive: damlTypes.Choice<Cash, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
  Cash_Split: damlTypes.Choice<Cash, Cash_Split, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.ContractId<Cash>, damlTypes.ContractId<Cash>>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
  Cash_Transfer: damlTypes.Choice<Cash, Cash_Transfer, damlTypes.ContractId<Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
  Cash_Merge: damlTypes.Choice<Cash, Cash_Merge, damlTypes.ContractId<Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
  Cash_Lock: damlTypes.Choice<Cash, Cash_Lock, damlTypes.ContractId<Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
  Cash_UnlockExpired: damlTypes.Choice<Cash, Cash_UnlockExpired, damlTypes.ContractId<Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
  Cash_SettleLocked: damlTypes.Choice<Cash, Cash_SettleLocked, damlTypes.ContractId<Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
  Cash_Disclose: damlTypes.Choice<Cash, Cash_Disclose, damlTypes.ContractId<Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
  Cash_Unlock: damlTypes.Choice<Cash, Cash_Unlock, damlTypes.ContractId<Cash>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Cash, undefined>>;
}
export declare const Cash:
  damlTypes.Template<Cash, undefined, '#kyd-tix:Kyd.Cash:Cash'> &
  damlTypes.ToInterface<Cash, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.Holding> &
  CashInterface;

export declare namespace Cash {
  export type CreateEvent = damlLedger.CreateEvent<Cash, undefined, typeof Cash.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<Cash, typeof Cash.templateId>
  export type Event = damlLedger.Event<Cash, undefined, typeof Cash.templateId>
  export type QueryResult = damlLedger.QueryResult<Cash, undefined, typeof Cash.templateId>
}


