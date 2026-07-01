// Generated from Splice/Api/Token/HoldingV1.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a from '@kyd/733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a';
import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

import * as Splice_Api_Token_MetadataV1 from '../../../../Splice/Api/Token/MetadataV1/module';

export declare type Holding = damlTypes.Interface<'0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900:Splice.Api.Token.HoldingV1:Holding'> & HoldingView;
export declare interface HoldingInterface {
  Archive: damlTypes.Choice<Holding, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.InterfaceCompanion<Holding, undefined>>;
}
export declare const Holding:
  damlTypes.InterfaceCompanion<Holding, undefined, '0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900:Splice.Api.Token.HoldingV1:Holding'> &
  damlTypes.FromTemplate<Holding, unknown> &
  HoldingInterface;


export declare type HoldingView = {
  owner: damlTypes.Party;
  instrumentId: InstrumentId;
  amount: damlTypes.Numeric;
  lock: damlTypes.Optional<Lock>;
  meta: Splice_Api_Token_MetadataV1.Metadata;
};

export declare const HoldingView:
  damlTypes.Serializable<HoldingView> & {
  }
;


export declare type Lock = {
  holders: damlTypes.Party[];
  expiresAt: damlTypes.Optional<damlTypes.Time>;
  expiresAfter: damlTypes.Optional<pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a.DA.Time.Types.RelTime>;
  context: damlTypes.Optional<string>;
};

export declare const Lock:
  damlTypes.Serializable<Lock> & {
  }
;


export declare type InstrumentId = {
  admin: damlTypes.Party;
  id: string;
};

export declare const InstrumentId:
  damlTypes.Serializable<InstrumentId> & {
  }
;

