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
var pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7 = require('@kyd/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7');
var pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 = require('@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662');


exports.Cash_SettleLocked = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newOwner: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    newOwner: damlTypes.Party.encode(__typed__.newOwner),
  };
}
,
};



exports.Cash_UnlockExpired = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Cash_Unlock = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Cash_Lock = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newLock: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.Lock.decoder, newLockRecipient: damlTypes.Party.decoder, newLockCoSigner: damlTypes.Optional(damlTypes.Party).decoder, }); }),
  encode: function (__typed__) {
  return {
    newLock: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.Lock.encode(__typed__.newLock),
    newLockRecipient: damlTypes.Party.encode(__typed__.newLockRecipient),
    newLockCoSigner: damlTypes.Optional(damlTypes.Party).encode(__typed__.newLockCoSigner),
  };
}
,
};



exports.Cash_Merge = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({otherCid: damlTypes.ContractId(exports.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    otherCid: damlTypes.ContractId(exports.Cash).encode(__typed__.otherCid),
  };
}
,
};



exports.Cash_Split = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({splitAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    splitAmount: damlTypes.Numeric(10).encode(__typed__.splitAmount),
  };
}
,
};



exports.Cash_Disclose = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({parties: damlTypes.List(damlTypes.Party).decoder, }); }),
  encode: function (__typed__) {
  return {
    parties: damlTypes.List(damlTypes.Party).encode(__typed__.parties),
  };
}
,
};



exports.Cash_Transfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newOwner: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    newOwner: damlTypes.Party.encode(__typed__.newOwner),
  };
}
,
};



exports.Cash = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Cash:Cash',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, owner: damlTypes.Party.decoder, amount: damlTypes.Numeric(10).decoder, lock: damlTypes.Optional(pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.Lock).decoder, lockRecipient: damlTypes.Optional(damlTypes.Party).decoder, lockCoSigner: damlTypes.Optional(damlTypes.Party).decoder, observers: damlTypes.List(damlTypes.Party).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    owner: damlTypes.Party.encode(__typed__.owner),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    lock: damlTypes.Optional(pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.Lock).encode(__typed__.lock),
    lockRecipient: damlTypes.Optional(damlTypes.Party).encode(__typed__.lockRecipient),
    lockCoSigner: damlTypes.Optional(damlTypes.Party).encode(__typed__.lockCoSigner),
    observers: damlTypes.List(damlTypes.Party).encode(__typed__.observers),
  };
}
,
  Archive: {
    template: function () { return exports.Cash; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Cash_Split: {
    template: function () { return exports.Cash; },
    choiceName: 'Cash_Split',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cash_Split.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cash_Split.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.Cash), damlTypes.ContractId(exports.Cash)).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.Cash), damlTypes.ContractId(exports.Cash)).encode(__typed__); },
  },
  Cash_Transfer: {
    template: function () { return exports.Cash; },
    choiceName: 'Cash_Transfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cash_Transfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cash_Transfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Cash).encode(__typed__); },
  },
  Cash_Merge: {
    template: function () { return exports.Cash; },
    choiceName: 'Cash_Merge',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cash_Merge.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cash_Merge.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Cash).encode(__typed__); },
  },
  Cash_Lock: {
    template: function () { return exports.Cash; },
    choiceName: 'Cash_Lock',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cash_Lock.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cash_Lock.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Cash).encode(__typed__); },
  },
  Cash_UnlockExpired: {
    template: function () { return exports.Cash; },
    choiceName: 'Cash_UnlockExpired',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cash_UnlockExpired.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cash_UnlockExpired.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Cash).encode(__typed__); },
  },
  Cash_SettleLocked: {
    template: function () { return exports.Cash; },
    choiceName: 'Cash_SettleLocked',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cash_SettleLocked.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cash_SettleLocked.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Cash).encode(__typed__); },
  },
  Cash_Disclose: {
    template: function () { return exports.Cash; },
    choiceName: 'Cash_Disclose',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cash_Disclose.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cash_Disclose.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Cash).encode(__typed__); },
  },
  Cash_Unlock: {
    template: function () { return exports.Cash; },
    choiceName: 'Cash_Unlock',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cash_Unlock.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cash_Unlock.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Cash).encode(__typed__); },
  },
}

, pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.Holding
);


damlTypes.registerTemplate(exports.Cash, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);

