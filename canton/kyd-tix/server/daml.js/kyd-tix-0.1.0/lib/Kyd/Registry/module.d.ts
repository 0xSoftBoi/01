// Generated from Kyd/Registry.daml
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

export declare type KydAllocation = {
  operator: damlTypes.Party;
  spec: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.AllocationSpecification;
  locked: damlTypes.ContractId<Kyd_Cash.Cash>;
};

export declare interface KydAllocationInterface {
  Archive: damlTypes.Choice<KydAllocation, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<KydAllocation, undefined>>;
}
export declare const KydAllocation:
  damlTypes.Template<KydAllocation, undefined, '#kyd-tix:Kyd.Registry:KydAllocation'> &
  damlTypes.ToInterface<KydAllocation, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation> &
  KydAllocationInterface;

export declare namespace KydAllocation {
  export type CreateEvent = damlLedger.CreateEvent<KydAllocation, undefined, typeof KydAllocation.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<KydAllocation, typeof KydAllocation.templateId>
  export type Event = damlLedger.Event<KydAllocation, undefined, typeof KydAllocation.templateId>
  export type QueryResult = damlLedger.QueryResult<KydAllocation, undefined, typeof KydAllocation.templateId>
}



export declare type KydAllocationFactory = {
  operator: damlTypes.Party;
  public: damlTypes.Party;
};

export declare interface KydAllocationFactoryInterface {
  Archive: damlTypes.Choice<KydAllocationFactory, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<KydAllocationFactory, undefined>>;
}
export declare const KydAllocationFactory:
  damlTypes.Template<KydAllocationFactory, undefined, '#kyd-tix:Kyd.Registry:KydAllocationFactory'> &
  damlTypes.ToInterface<KydAllocationFactory, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationInstructionV1.AllocationFactory> &
  KydAllocationFactoryInterface;

export declare namespace KydAllocationFactory {
  export type CreateEvent = damlLedger.CreateEvent<KydAllocationFactory, undefined, typeof KydAllocationFactory.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<KydAllocationFactory, typeof KydAllocationFactory.templateId>
  export type Event = damlLedger.Event<KydAllocationFactory, undefined, typeof KydAllocationFactory.templateId>
  export type QueryResult = damlLedger.QueryResult<KydAllocationFactory, undefined, typeof KydAllocationFactory.templateId>
}



export declare type KydTransferFactory = {
  operator: damlTypes.Party;
  public: damlTypes.Party;
};

export declare interface KydTransferFactoryInterface {
  Archive: damlTypes.Choice<KydTransferFactory, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<KydTransferFactory, undefined>>;
}
export declare const KydTransferFactory:
  damlTypes.Template<KydTransferFactory, undefined, '#kyd-tix:Kyd.Registry:KydTransferFactory'> &
  damlTypes.ToInterface<KydTransferFactory, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.TransferInstructionV1.TransferFactory> &
  KydTransferFactoryInterface;

export declare namespace KydTransferFactory {
  export type CreateEvent = damlLedger.CreateEvent<KydTransferFactory, undefined, typeof KydTransferFactory.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<KydTransferFactory, typeof KydTransferFactory.templateId>
  export type Event = damlLedger.Event<KydTransferFactory, undefined, typeof KydTransferFactory.templateId>
  export type QueryResult = damlLedger.QueryResult<KydTransferFactory, undefined, typeof KydTransferFactory.templateId>
}


