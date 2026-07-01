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

var pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900 = require('@kyd/splice-api-token-vendored-1.0.0');
var pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 = require('@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662');

var Kyd_Cash = require('../../Kyd/Cash/module');


exports.KydAllocation = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Registry:KydAllocation',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, spec: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.AllocationSpecification.decoder, locked: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    spec: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.AllocationSpecification.encode(__typed__.spec),
    locked: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.locked),
  };
}
,
  Archive: {
    template: function () { return exports.KydAllocation; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation
);


damlTypes.registerTemplate(exports.KydAllocation, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.KydAllocationFactory = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Registry:KydAllocationFactory',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, public: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    public: damlTypes.Party.encode(__typed__.public),
  };
}
,
  Archive: {
    template: function () { return exports.KydAllocationFactory; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationInstructionV1.AllocationFactory
);


damlTypes.registerTemplate(exports.KydAllocationFactory, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.KydTransferFactory = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Registry:KydTransferFactory',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, public: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    public: damlTypes.Party.encode(__typed__.public),
  };
}
,
  Archive: {
    template: function () { return exports.KydTransferFactory; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.TransferInstructionV1.TransferFactory
);


damlTypes.registerTemplate(exports.KydTransferFactory, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);

