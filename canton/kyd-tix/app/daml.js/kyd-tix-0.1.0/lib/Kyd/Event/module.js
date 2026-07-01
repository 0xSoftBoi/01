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

var pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7 = require('@kyd/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7');
var pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 = require('@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662');

var Kyd_Cash = require('../../Kyd/Cash/module');
var Kyd_Ticket = require('../../Kyd/Ticket/module');


exports.PurchaseOrder_Reject = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.PurchaseOrder_Cancel = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.PurchaseOrder_Fill = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({allocationCid: damlTypes.ContractId(exports.TierAllocation).decoder, }); }),
  encode: function (__typed__) {
  return {
    allocationCid: damlTypes.ContractId(exports.TierAllocation).encode(__typed__.allocationCid),
  };
}
,
};



exports.PurchaseOrder = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Event:PurchaseOrder',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, fan: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, tierId: damlTypes.Text.decoder, cashCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    fan: damlTypes.Party.encode(__typed__.fan),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    tierId: damlTypes.Text.encode(__typed__.tierId),
    cashCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.cashCid),
  };
}
,
  PurchaseOrder_Fill: {
    template: function () { return exports.PurchaseOrder; },
    choiceName: 'PurchaseOrder_Fill',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.PurchaseOrder_Fill.decoder; }),
    argumentEncode: function (__typed__) { return exports.PurchaseOrder_Fill.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.TierAllocation)), damlTypes.ContractId(Kyd_Ticket.Ticket)).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.TierAllocation)), damlTypes.ContractId(Kyd_Ticket.Ticket)).encode(__typed__); },
  },
  PurchaseOrder_Cancel: {
    template: function () { return exports.PurchaseOrder; },
    choiceName: 'PurchaseOrder_Cancel',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.PurchaseOrder_Cancel.decoder; }),
    argumentEncode: function (__typed__) { return exports.PurchaseOrder_Cancel.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.PurchaseOrder; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  PurchaseOrder_Reject: {
    template: function () { return exports.PurchaseOrder; },
    choiceName: 'PurchaseOrder_Reject',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.PurchaseOrder_Reject.decoder; }),
    argumentEncode: function (__typed__) { return exports.PurchaseOrder_Reject.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.PurchaseOrder, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.Allocation_Reprice = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({repricer: damlTypes.Party.decoder, newPrice: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    repricer: damlTypes.Party.encode(__typed__.repricer),
    newPrice: damlTypes.Numeric(10).encode(__typed__.newPrice),
  };
}
,
};



exports.Allocation_IssuePaid = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({fan: damlTypes.Party.decoder, paymentCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    fan: damlTypes.Party.encode(__typed__.fan),
    paymentCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.paymentCid),
  };
}
,
};



exports.Allocation_Issue = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({fan: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    fan: damlTypes.Party.encode(__typed__.fan),
  };
}
,
};



exports.TierAllocation = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Event:TierAllocation',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, artist: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, eventTime: damlTypes.Time.decoder, tierId: damlTypes.Text.decoder, price: damlTypes.Numeric(10).decoder, resaleCapBps: damlTypes.Int.decoder, royaltyBps: damlTypes.Int.decoder, financingShareBps: damlTypes.Int.decoder, serialBase: damlTypes.Int.decoder, size: damlTypes.Int.decoder, sold: damlTypes.Int.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    artist: damlTypes.Party.encode(__typed__.artist),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    eventTime: damlTypes.Time.encode(__typed__.eventTime),
    tierId: damlTypes.Text.encode(__typed__.tierId),
    price: damlTypes.Numeric(10).encode(__typed__.price),
    resaleCapBps: damlTypes.Int.encode(__typed__.resaleCapBps),
    royaltyBps: damlTypes.Int.encode(__typed__.royaltyBps),
    financingShareBps: damlTypes.Int.encode(__typed__.financingShareBps),
    serialBase: damlTypes.Int.encode(__typed__.serialBase),
    size: damlTypes.Int.encode(__typed__.size),
    sold: damlTypes.Int.encode(__typed__.sold),
  };
}
,
  Allocation_IssuePaid: {
    template: function () { return exports.TierAllocation; },
    choiceName: 'Allocation_IssuePaid',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Allocation_IssuePaid.decoder; }),
    argumentEncode: function (__typed__) { return exports.Allocation_IssuePaid.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.TierAllocation)), damlTypes.ContractId(Kyd_Ticket.Ticket)).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.TierAllocation)), damlTypes.ContractId(Kyd_Ticket.Ticket)).encode(__typed__); },
  },
  Allocation_Issue: {
    template: function () { return exports.TierAllocation; },
    choiceName: 'Allocation_Issue',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Allocation_Issue.decoder; }),
    argumentEncode: function (__typed__) { return exports.Allocation_Issue.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.TierAllocation)), damlTypes.ContractId(Kyd_Ticket.Ticket)).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.TierAllocation)), damlTypes.ContractId(Kyd_Ticket.Ticket)).encode(__typed__); },
  },
  Allocation_Reprice: {
    template: function () { return exports.TierAllocation; },
    choiceName: 'Allocation_Reprice',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Allocation_Reprice.decoder; }),
    argumentEncode: function (__typed__) { return exports.Allocation_Reprice.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.TierAllocation).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.TierAllocation).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.TierAllocation; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.TierAllocation, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.Event_SetTierBasePrice = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({repricer: damlTypes.Party.decoder, tierId: damlTypes.Text.decoder, newBasePrice: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    repricer: damlTypes.Party.encode(__typed__.repricer),
    tierId: damlTypes.Text.encode(__typed__.tierId),
    newBasePrice: damlTypes.Numeric(10).encode(__typed__.newBasePrice),
  };
}
,
};



exports.Event_OpenAllocation = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({tierId: damlTypes.Text.decoder, size: damlTypes.Int.decoder, }); }),
  encode: function (__typed__) {
  return {
    tierId: damlTypes.Text.encode(__typed__.tierId),
    size: damlTypes.Int.encode(__typed__.size),
  };
}
,
};



exports.Event = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Event:Event',
  keyDecoder: damlTypes.lazyMemo(function () { return damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Party, damlTypes.Text).decoder; }); }),
  keyEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Party, damlTypes.Text).encode(__typed__); },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, artist: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, name: damlTypes.Text.decoder, eventTime: damlTypes.Time.decoder, royaltyBps: damlTypes.Int.decoder, financingShareBps: damlTypes.Int.decoder, tiers: damlTypes.List(exports.Tier).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    artist: damlTypes.Party.encode(__typed__.artist),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    name: damlTypes.Text.encode(__typed__.name),
    eventTime: damlTypes.Time.encode(__typed__.eventTime),
    royaltyBps: damlTypes.Int.encode(__typed__.royaltyBps),
    financingShareBps: damlTypes.Int.encode(__typed__.financingShareBps),
    tiers: damlTypes.List(exports.Tier).encode(__typed__.tiers),
  };
}
,
  Event_OpenAllocation: {
    template: function () { return exports.Event; },
    choiceName: 'Event_OpenAllocation',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Event_OpenAllocation.decoder; }),
    argumentEncode: function (__typed__) { return exports.Event_OpenAllocation.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.Event), damlTypes.ContractId(exports.TierAllocation)).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.Event), damlTypes.ContractId(exports.TierAllocation)).encode(__typed__); },
  },
  Event_SetTierBasePrice: {
    template: function () { return exports.Event; },
    choiceName: 'Event_SetTierBasePrice',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Event_SetTierBasePrice.decoder; }),
    argumentEncode: function (__typed__) { return exports.Event_SetTierBasePrice.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Event).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Event).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.Event; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.Event, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.Tier = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({tierId: damlTypes.Text.decoder, basePrice: damlTypes.Numeric(10).decoder, demandBps: damlTypes.Int.decoder, resaleCapBps: damlTypes.Int.decoder, supply: damlTypes.Int.decoder, allocated: damlTypes.Int.decoder, }); }),
  encode: function (__typed__) {
  return {
    tierId: damlTypes.Text.encode(__typed__.tierId),
    basePrice: damlTypes.Numeric(10).encode(__typed__.basePrice),
    demandBps: damlTypes.Int.encode(__typed__.demandBps),
    resaleCapBps: damlTypes.Int.encode(__typed__.resaleCapBps),
    supply: damlTypes.Int.encode(__typed__.supply),
    allocated: damlTypes.Int.encode(__typed__.allocated),
  };
}
,
};

