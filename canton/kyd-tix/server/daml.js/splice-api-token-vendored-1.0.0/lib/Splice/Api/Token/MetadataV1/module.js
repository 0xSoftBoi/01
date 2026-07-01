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

exports.AnyContract = damlTypes.assembleInterface(
  '0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900:Splice.Api.Token.MetadataV1:AnyContract',
  function () { return exports.AnyContractView; },
  {
    Archive: {
      template: function () { return exports.AnyContract; },
      choiceName: 'Archive',
      argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
      argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
      resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
    },
  });



exports.ChoiceExecutionMetadata = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({meta: exports.Metadata.decoder, }); }),
  encode: function (__typed__) {
  return {
    meta: exports.Metadata.encode(__typed__.meta),
  };
}
,
};



exports.ExtraArgs = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({context: exports.ChoiceContext.decoder, meta: exports.Metadata.decoder, }); }),
  encode: function (__typed__) {
  return {
    context: exports.ChoiceContext.encode(__typed__.context),
    meta: exports.Metadata.encode(__typed__.meta),
  };
}
,
};



exports.Metadata = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({values: damlTypes.TextMap(damlTypes.Text).decoder, }); }),
  encode: function (__typed__) {
  return {
    values: damlTypes.TextMap(damlTypes.Text).encode(__typed__.values),
  };
}
,
};



exports.ChoiceContext = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({values: damlTypes.TextMap(exports.AnyValue).decoder, }); }),
  encode: function (__typed__) {
  return {
    values: damlTypes.TextMap(exports.AnyValue).encode(__typed__.values),
  };
}
,
};



exports.AnyContractView = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.AnyValue = {
  decoder: damlTypes.lazyMemo(function () { return jtv.oneOf(jtv.object({tag: jtv.constant('AV_Text'), value: damlTypes.Text.decoder, }), jtv.object({tag: jtv.constant('AV_Int'), value: damlTypes.Int.decoder, }), jtv.object({tag: jtv.constant('AV_Decimal'), value: damlTypes.Numeric(10).decoder, }), jtv.object({tag: jtv.constant('AV_Bool'), value: damlTypes.Bool.decoder, }), jtv.object({tag: jtv.constant('AV_Date'), value: damlTypes.Date.decoder, }), jtv.object({tag: jtv.constant('AV_Time'), value: damlTypes.Time.decoder, }), jtv.object({tag: jtv.constant('AV_RelTime'), value: pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a.DA.Time.Types.RelTime.decoder, }), jtv.object({tag: jtv.constant('AV_Party'), value: damlTypes.Party.decoder, }), jtv.object({tag: jtv.constant('AV_ContractId'), value: damlTypes.ContractId(exports.AnyContract).decoder, }), jtv.object({tag: jtv.constant('AV_List'), value: damlTypes.List(exports.AnyValue).decoder, }), jtv.object({tag: jtv.constant('AV_Map'), value: damlTypes.TextMap(exports.AnyValue).decoder, })); }),
  encode: function (__typed__) {
  switch(__typed__.tag) {
    case 'AV_Text': return {tag: __typed__.tag, value: damlTypes.Text.encode(__typed__.value)};
    case 'AV_Int': return {tag: __typed__.tag, value: damlTypes.Int.encode(__typed__.value)};
    case 'AV_Decimal': return {tag: __typed__.tag, value: damlTypes.Numeric(10).encode(__typed__.value)};
    case 'AV_Bool': return {tag: __typed__.tag, value: damlTypes.Bool.encode(__typed__.value)};
    case 'AV_Date': return {tag: __typed__.tag, value: damlTypes.Date.encode(__typed__.value)};
    case 'AV_Time': return {tag: __typed__.tag, value: damlTypes.Time.encode(__typed__.value)};
    case 'AV_RelTime': return {tag: __typed__.tag, value: pkg733e38d36a2759688a4b2c4cec69d48e7b55ecc8dedc8067b815926c917a182a.DA.Time.Types.RelTime.encode(__typed__.value)};
    case 'AV_Party': return {tag: __typed__.tag, value: damlTypes.Party.encode(__typed__.value)};
    case 'AV_ContractId': return {tag: __typed__.tag, value: damlTypes.ContractId(exports.AnyContract).encode(__typed__.value)};
    case 'AV_List': return {tag: __typed__.tag, value: damlTypes.List(exports.AnyValue).encode(__typed__.value)};
    case 'AV_Map': return {tag: __typed__.tag, value: damlTypes.TextMap(exports.AnyValue).encode(__typed__.value)};
    default: throw 'unrecognized type tag: ' + __typed__.tag + ' while serializing a value of type AnyValue';
  }
}
,
};

