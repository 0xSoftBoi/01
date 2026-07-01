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

var pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a = require('@kyd/733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a');
var pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 = require('@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662');

var Splice_Api_Token_MetadataV1 = require('../../../../Splice/Api/Token/MetadataV1/module');

exports.Holding = damlTypes.assembleInterface(
  '0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900:Splice.Api.Token.HoldingV1:Holding',
  function () { return exports.HoldingView; },
  {
    Archive: {
      template: function () { return exports.Holding; },
      choiceName: 'Archive',
      argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
      argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
      resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
    },
  });



exports.HoldingView = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({owner: damlTypes.Party.decoder, instrumentId: exports.InstrumentId.decoder, amount: damlTypes.Numeric(10).decoder, lock: damlTypes.Optional(exports.Lock).decoder, meta: Splice_Api_Token_MetadataV1.Metadata.decoder, }); }),
  encode: function (__typed__) {
  return {
    owner: damlTypes.Party.encode(__typed__.owner),
    instrumentId: exports.InstrumentId.encode(__typed__.instrumentId),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    lock: damlTypes.Optional(exports.Lock).encode(__typed__.lock),
    meta: Splice_Api_Token_MetadataV1.Metadata.encode(__typed__.meta),
  };
}
,
};



exports.Lock = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({holders: damlTypes.List(damlTypes.Party).decoder, expiresAt: damlTypes.Optional(damlTypes.Time).decoder, expiresAfter: damlTypes.Optional(pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a.DA.Time.Types.RelTime).decoder, context: damlTypes.Optional(damlTypes.Text).decoder, }); }),
  encode: function (__typed__) {
  return {
    holders: damlTypes.List(damlTypes.Party).encode(__typed__.holders),
    expiresAt: damlTypes.Optional(damlTypes.Time).encode(__typed__.expiresAt),
    expiresAfter: damlTypes.Optional(pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a.DA.Time.Types.RelTime).encode(__typed__.expiresAfter),
    context: damlTypes.Optional(damlTypes.Text).encode(__typed__.context),
  };
}
,
};



exports.InstrumentId = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({admin: damlTypes.Party.decoder, id: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    admin: damlTypes.Party.encode(__typed__.admin),
    id: damlTypes.Text.encode(__typed__.id),
  };
}
,
};

