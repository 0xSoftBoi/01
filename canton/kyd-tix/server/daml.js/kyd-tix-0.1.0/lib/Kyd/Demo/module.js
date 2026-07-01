"use strict";
/* eslint-disable-next-line no-unused-vars */
function __export(m) {
/* eslint-disable-next-line no-prototype-builtins */
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable-next-line no-unused-vars */
var jtv = require('@mojotech/json-type-validation');
/* eslint-disable-next-line no-unused-vars */
var damlTypes = require('@daml/types');
/* eslint-disable-next-line no-unused-vars */
var damlLedger = require('@daml/ledger');


exports.DemoParties = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, artist: damlTypes.Party.decoder, alice: damlTypes.Party.decoder, bob: damlTypes.Party.decoder, lender: damlTypes.Party.decoder, lender2: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    artist: damlTypes.Party.encode(__typed__.artist),
    alice: damlTypes.Party.encode(__typed__.alice),
    bob: damlTypes.Party.encode(__typed__.bob),
    lender: damlTypes.Party.encode(__typed__.lender),
    lender2: damlTypes.Party.encode(__typed__.lender2),
  };
}
,
};

