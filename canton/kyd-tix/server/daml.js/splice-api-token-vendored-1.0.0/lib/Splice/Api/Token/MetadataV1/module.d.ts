// Generated from Splice/Api/Token/MetadataV1.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a from '@kyd/733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a';
import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

export declare type AnyContract = damlTypes.Interface<'0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900:Splice.Api.Token.MetadataV1:AnyContract'> & AnyContractView;
export declare interface AnyContractInterface {
  Archive: damlTypes.Choice<AnyContract, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.InterfaceCompanion<AnyContract, undefined>>;
}
export declare const AnyContract:
  damlTypes.InterfaceCompanion<AnyContract, undefined, '0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900:Splice.Api.Token.MetadataV1:AnyContract'> &
  damlTypes.FromTemplate<AnyContract, unknown> &
  AnyContractInterface;


export declare type ChoiceExecutionMetadata = {
  meta: Metadata;
};

export declare const ChoiceExecutionMetadata:
  damlTypes.Serializable<ChoiceExecutionMetadata> & {
  }
;


export declare type ExtraArgs = {
  context: ChoiceContext;
  meta: Metadata;
};

export declare const ExtraArgs:
  damlTypes.Serializable<ExtraArgs> & {
  }
;


export declare type Metadata = {
  values: { [key: string]: string };
};

export declare const Metadata:
  damlTypes.Serializable<Metadata> & {
  }
;


export declare type ChoiceContext = {
  values: { [key: string]: AnyValue };
};

export declare const ChoiceContext:
  damlTypes.Serializable<ChoiceContext> & {
  }
;


export declare type AnyContractView = {
};

export declare const AnyContractView:
  damlTypes.Serializable<AnyContractView> & {
  }
;


export declare type AnyValue =
  |  { tag: 'AV_Text'; value: string }
  |  { tag: 'AV_Int'; value: damlTypes.Int }
  |  { tag: 'AV_Decimal'; value: damlTypes.Numeric }
  |  { tag: 'AV_Bool'; value: boolean }
  |  { tag: 'AV_Date'; value: damlTypes.Date }
  |  { tag: 'AV_Time'; value: damlTypes.Time }
  |  { tag: 'AV_RelTime'; value: pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a.DA.Time.Types.RelTime }
  |  { tag: 'AV_Party'; value: damlTypes.Party }
  |  { tag: 'AV_ContractId'; value: damlTypes.ContractId<AnyContract> }
  |  { tag: 'AV_List'; value: AnyValue[] }
  |  { tag: 'AV_Map'; value: { [key: string]: AnyValue } }
;

export declare const AnyValue:
  damlTypes.Serializable<AnyValue> & {
  }
;

