// Generated from Kyd/Demo.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

export declare type DemoParties = {
  operator: damlTypes.Party;
  venue: damlTypes.Party;
  artist: damlTypes.Party;
  alice: damlTypes.Party;
  bob: damlTypes.Party;
  lender: damlTypes.Party;
  lender2: damlTypes.Party;
};

export declare const DemoParties:
  damlTypes.Serializable<DemoParties> & {
  }
;

