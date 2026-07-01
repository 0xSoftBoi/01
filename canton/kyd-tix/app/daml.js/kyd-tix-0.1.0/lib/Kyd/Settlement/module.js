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

var pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 = require('@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662');

var Kyd_Cash = require('../../Kyd/Cash/module');


exports.Receipt_Refund = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Receipt_Release = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.RevenueShare = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Settlement:RevenueShare',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, amount: damlTypes.Numeric(10).decoder, locked: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    locked: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.locked),
  };
}
,
  Receipt_Release: {
    template: function () { return exports.RevenueShare; },
    choiceName: 'Receipt_Release',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Receipt_Release.decoder; }),
    argumentEncode: function (__typed__) { return exports.Receipt_Release.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(Kyd_Cash.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__); },
  },
  Receipt_Refund: {
    template: function () { return exports.RevenueShare; },
    choiceName: 'Receipt_Refund',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Receipt_Refund.decoder; }),
    argumentEncode: function (__typed__) { return exports.Receipt_Refund.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(Kyd_Cash.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.RevenueShare; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.RevenueShare, ['ceef8cbd3c876d1a2b47ae14a2a82984bc90005cfcb7eede410c3485b2073519', '#kyd-tix']);

