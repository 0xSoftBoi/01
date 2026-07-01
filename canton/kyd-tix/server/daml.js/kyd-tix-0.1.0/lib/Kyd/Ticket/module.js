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


exports.DvPResale_Withdraw = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.DvPResale_Reject = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.DvPResale_Settle = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({sellerLegCid: damlTypes.ContractId(pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation).decoder, royaltyLegCid: damlTypes.Optional(damlTypes.ContractId(pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation)).decoder, royaltyAccountCid: damlTypes.Optional(damlTypes.ContractId(exports.RoyaltyAccount)).decoder, extraArgs: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.MetadataV1.ExtraArgs.decoder, }); }),
  encode: function (__typed__) {
  return {
    sellerLegCid: damlTypes.ContractId(pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation).encode(__typed__.sellerLegCid),
    royaltyLegCid: damlTypes.Optional(damlTypes.ContractId(pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation)).encode(__typed__.royaltyLegCid),
    royaltyAccountCid: damlTypes.Optional(damlTypes.ContractId(exports.RoyaltyAccount)).encode(__typed__.royaltyAccountCid),
    extraArgs: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.MetadataV1.ExtraArgs.encode(__typed__.extraArgs),
  };
}
,
};



exports.DvPResaleOffer = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Ticket:DvPResaleOffer',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({ticket: exports.Ticket.decoder, buyer: damlTypes.Party.decoder, salePrice: damlTypes.Numeric(10).decoder, paymentInstrument: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.InstrumentId.decoder, settlementRef: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    ticket: exports.Ticket.encode(__typed__.ticket),
    buyer: damlTypes.Party.encode(__typed__.buyer),
    salePrice: damlTypes.Numeric(10).encode(__typed__.salePrice),
    paymentInstrument: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.InstrumentId.encode(__typed__.paymentInstrument),
    settlementRef: damlTypes.Text.encode(__typed__.settlementRef),
  };
}
,
  DvPResale_Settle: {
    template: function () { return exports.DvPResaleOffer; },
    choiceName: 'DvPResale_Settle',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.DvPResale_Settle.decoder; }),
    argumentEncode: function (__typed__) { return exports.DvPResale_Settle.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  DvPResale_Reject: {
    template: function () { return exports.DvPResaleOffer; },
    choiceName: 'DvPResale_Reject',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.DvPResale_Reject.decoder; }),
    argumentEncode: function (__typed__) { return exports.DvPResale_Reject.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.DvPResaleOffer; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  DvPResale_Withdraw: {
    template: function () { return exports.DvPResaleOffer; },
    choiceName: 'DvPResale_Withdraw',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.DvPResale_Withdraw.decoder; }),
    argumentEncode: function (__typed__) { return exports.DvPResale_Withdraw.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.DvPResaleOffer, ['ceef8cbd3c876d1a2b47ae14a2a82984bc90005cfcb7eede410c3485b2073519', '#kyd-tix']);



exports.RoyaltyAccount_CollectLeg = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({legCid: damlTypes.ContractId(pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation).decoder, payer: damlTypes.Party.decoder, extraArgs: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.MetadataV1.ExtraArgs.decoder, }); }),
  encode: function (__typed__) {
  return {
    legCid: damlTypes.ContractId(pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation).encode(__typed__.legCid),
    payer: damlTypes.Party.encode(__typed__.payer),
    extraArgs: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.MetadataV1.ExtraArgs.encode(__typed__.extraArgs),
  };
}
,
};



exports.RoyaltyAccount = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Ticket:RoyaltyAccount',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, artist: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    artist: damlTypes.Party.encode(__typed__.artist),
  };
}
,
  RoyaltyAccount_CollectLeg: {
    template: function () { return exports.RoyaltyAccount; },
    choiceName: 'RoyaltyAccount_CollectLeg',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.RoyaltyAccount_CollectLeg.decoder; }),
    argumentEncode: function (__typed__) { return exports.RoyaltyAccount_CollectLeg.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation_ExecuteTransferResult.decoder; }),
    resultEncode: function (__typed__) { return pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.AllocationV1.Allocation_ExecuteTransferResult.encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.RoyaltyAccount; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.RoyaltyAccount, ['ceef8cbd3c876d1a2b47ae14a2a82984bc90005cfcb7eede410c3485b2073519', '#kyd-tix']);



exports.GiftOffer_Withdraw = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.GiftOffer_Decline = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.GiftOffer_Accept = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.GiftOffer = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Ticket:GiftOffer',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({ticket: exports.Ticket.decoder, recipient: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    ticket: exports.Ticket.encode(__typed__.ticket),
    recipient: damlTypes.Party.encode(__typed__.recipient),
  };
}
,
  GiftOffer_Accept: {
    template: function () { return exports.GiftOffer; },
    choiceName: 'GiftOffer_Accept',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.GiftOffer_Accept.decoder; }),
    argumentEncode: function (__typed__) { return exports.GiftOffer_Accept.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  GiftOffer_Decline: {
    template: function () { return exports.GiftOffer; },
    choiceName: 'GiftOffer_Decline',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.GiftOffer_Decline.decoder; }),
    argumentEncode: function (__typed__) { return exports.GiftOffer_Decline.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  GiftOffer_Withdraw: {
    template: function () { return exports.GiftOffer; },
    choiceName: 'GiftOffer_Withdraw',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.GiftOffer_Withdraw.decoder; }),
    argumentEncode: function (__typed__) { return exports.GiftOffer_Withdraw.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.GiftOffer; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.GiftOffer, ['ceef8cbd3c876d1a2b47ae14a2a82984bc90005cfcb7eede410c3485b2073519', '#kyd-tix']);



exports.ResaleOffer_Withdraw = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.ResaleOffer_Reject = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.ResaleOffer_Accept = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({cashCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    cashCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.cashCid),
  };
}
,
};



exports.ResaleOffer = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Ticket:ResaleOffer',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({ticket: exports.Ticket.decoder, buyer: damlTypes.Party.decoder, salePrice: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    ticket: exports.Ticket.encode(__typed__.ticket),
    buyer: damlTypes.Party.encode(__typed__.buyer),
    salePrice: damlTypes.Numeric(10).encode(__typed__.salePrice),
  };
}
,
  ResaleOffer_Accept: {
    template: function () { return exports.ResaleOffer; },
    choiceName: 'ResaleOffer_Accept',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ResaleOffer_Accept.decoder; }),
    argumentEncode: function (__typed__) { return exports.ResaleOffer_Accept.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  ResaleOffer_Reject: {
    template: function () { return exports.ResaleOffer; },
    choiceName: 'ResaleOffer_Reject',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ResaleOffer_Reject.decoder; }),
    argumentEncode: function (__typed__) { return exports.ResaleOffer_Reject.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  ResaleOffer_Withdraw: {
    template: function () { return exports.ResaleOffer; },
    choiceName: 'ResaleOffer_Withdraw',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ResaleOffer_Withdraw.decoder; }),
    argumentEncode: function (__typed__) { return exports.ResaleOffer_Withdraw.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.ResaleOffer; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.ResaleOffer, ['ceef8cbd3c876d1a2b47ae14a2a82984bc90005cfcb7eede410c3485b2073519', '#kyd-tix']);



exports.Ticket_OfferDvP = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({buyer: damlTypes.Party.decoder, salePrice: damlTypes.Numeric(10).decoder, paymentInstrument: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.InstrumentId.decoder, settlementRef: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    buyer: damlTypes.Party.encode(__typed__.buyer),
    salePrice: damlTypes.Numeric(10).encode(__typed__.salePrice),
    paymentInstrument: pkg0fda37a3ae5ff52c2032aac79884f38e64179923382a91769b3cbb99371d7900.Splice.Api.Token.HoldingV1.InstrumentId.encode(__typed__.paymentInstrument),
    settlementRef: damlTypes.Text.encode(__typed__.settlementRef),
  };
}
,
};



exports.Ticket_Refund = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({cashCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    cashCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.cashCid),
  };
}
,
};



exports.Ticket_OfferGift = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({recipient: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    recipient: damlTypes.Party.encode(__typed__.recipient),
  };
}
,
};



exports.Ticket_Offer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({buyer: damlTypes.Party.decoder, salePrice: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    buyer: damlTypes.Party.encode(__typed__.buyer),
    salePrice: damlTypes.Numeric(10).encode(__typed__.salePrice),
  };
}
,
};



exports.Ticket_CheckIn = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Ticket = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Ticket:Ticket',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, artist: damlTypes.Party.decoder, owner: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, eventTime: damlTypes.Time.decoder, tierId: damlTypes.Text.decoder, serial: damlTypes.Int.decoder, facePrice: damlTypes.Numeric(10).decoder, maxResalePrice: damlTypes.Numeric(10).decoder, royaltyBps: damlTypes.Int.decoder, redeemed: damlTypes.Bool.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    artist: damlTypes.Party.encode(__typed__.artist),
    owner: damlTypes.Party.encode(__typed__.owner),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    eventTime: damlTypes.Time.encode(__typed__.eventTime),
    tierId: damlTypes.Text.encode(__typed__.tierId),
    serial: damlTypes.Int.encode(__typed__.serial),
    facePrice: damlTypes.Numeric(10).encode(__typed__.facePrice),
    maxResalePrice: damlTypes.Numeric(10).encode(__typed__.maxResalePrice),
    royaltyBps: damlTypes.Int.encode(__typed__.royaltyBps),
    redeemed: damlTypes.Bool.encode(__typed__.redeemed),
  };
}
,
  Ticket_CheckIn: {
    template: function () { return exports.Ticket; },
    choiceName: 'Ticket_CheckIn',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Ticket_CheckIn.decoder; }),
    argumentEncode: function (__typed__) { return exports.Ticket_CheckIn.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Ticket).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Ticket).encode(__typed__); },
  },
  Ticket_Offer: {
    template: function () { return exports.Ticket; },
    choiceName: 'Ticket_Offer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Ticket_Offer.decoder; }),
    argumentEncode: function (__typed__) { return exports.Ticket_Offer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.ResaleOffer).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.ResaleOffer).encode(__typed__); },
  },
  Ticket_OfferGift: {
    template: function () { return exports.Ticket; },
    choiceName: 'Ticket_OfferGift',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Ticket_OfferGift.decoder; }),
    argumentEncode: function (__typed__) { return exports.Ticket_OfferGift.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.GiftOffer).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.GiftOffer).encode(__typed__); },
  },
  Ticket_Refund: {
    template: function () { return exports.Ticket; },
    choiceName: 'Ticket_Refund',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Ticket_Refund.decoder; }),
    argumentEncode: function (__typed__) { return exports.Ticket_Refund.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(Kyd_Cash.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__); },
  },
  Ticket_OfferDvP: {
    template: function () { return exports.Ticket; },
    choiceName: 'Ticket_OfferDvP',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Ticket_OfferDvP.decoder; }),
    argumentEncode: function (__typed__) { return exports.Ticket_OfferDvP.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.DvPResaleOffer).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.DvPResaleOffer).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.Ticket; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.Ticket, ['ceef8cbd3c876d1a2b47ae14a2a82984bc90005cfcb7eede410c3485b2073519', '#kyd-tix']);

