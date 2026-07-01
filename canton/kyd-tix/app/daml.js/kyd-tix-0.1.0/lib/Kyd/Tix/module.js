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
var Kyd_Settlement = require('../../Kyd/Settlement/module');


exports.TrancheOffer_Reject = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.TrancheOffer_Withdraw = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.TrancheOffer_Accept = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({cashCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    cashCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.cashCid),
  };
}
,
};



exports.TrancheOffer = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Tix:TrancheOffer',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, seller: damlTypes.Party.decoder, buyer: damlTypes.Party.decoder, faceAmount: damlTypes.Numeric(10).decoder, price: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    seller: damlTypes.Party.encode(__typed__.seller),
    buyer: damlTypes.Party.encode(__typed__.buyer),
    faceAmount: damlTypes.Numeric(10).encode(__typed__.faceAmount),
    price: damlTypes.Numeric(10).encode(__typed__.price),
  };
}
,
  TrancheOffer_Accept: {
    template: function () { return exports.TrancheOffer; },
    choiceName: 'TrancheOffer_Accept',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.TrancheOffer_Accept.decoder; }),
    argumentEncode: function (__typed__) { return exports.TrancheOffer_Accept.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.SyndicatedLoan).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.SyndicatedLoan).encode(__typed__); },
  },
  TrancheOffer_Withdraw: {
    template: function () { return exports.TrancheOffer; },
    choiceName: 'TrancheOffer_Withdraw',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.TrancheOffer_Withdraw.decoder; }),
    argumentEncode: function (__typed__) { return exports.TrancheOffer_Withdraw.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.TrancheOffer; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  TrancheOffer_Reject: {
    template: function () { return exports.TrancheOffer; },
    choiceName: 'TrancheOffer_Reject',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.TrancheOffer_Reject.decoder; }),
    argumentEncode: function (__typed__) { return exports.TrancheOffer_Reject.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.TrancheOffer, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.Loan_ExecuteTrancheTransfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({seller: damlTypes.Party.decoder, buyer: damlTypes.Party.decoder, faceAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    seller: damlTypes.Party.encode(__typed__.seller),
    buyer: damlTypes.Party.encode(__typed__.buyer),
    faceAmount: damlTypes.Numeric(10).encode(__typed__.faceAmount),
  };
}
,
};



exports.Loan_OfferTranche = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({seller: damlTypes.Party.decoder, buyer: damlTypes.Party.decoder, faceAmount: damlTypes.Numeric(10).decoder, price: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    seller: damlTypes.Party.encode(__typed__.seller),
    buyer: damlTypes.Party.encode(__typed__.buyer),
    faceAmount: damlTypes.Numeric(10).encode(__typed__.faceAmount),
    price: damlTypes.Numeric(10).encode(__typed__.price),
  };
}
,
};



exports.Loan_SweepRevenue = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({receiptCids: damlTypes.List(damlTypes.ContractId(Kyd_Settlement.RevenueShare)).decoder, }); }),
  encode: function (__typed__) {
  return {
    receiptCids: damlTypes.List(damlTypes.ContractId(Kyd_Settlement.RevenueShare)).encode(__typed__.receiptCids),
  };
}
,
};



exports.Loan_AccrueLateInterest = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Loan_SettleRevenue = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({revenueCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    revenueCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.revenueCid),
  };
}
,
};



exports.Loan_Distribute = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({cashCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    cashCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.cashCid),
  };
}
,
};



exports.SyndicatedLoan = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Tix:SyndicatedLoan',
  keyDecoder: damlTypes.lazyMemo(function () { return damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Party, damlTypes.Text).decoder; }); }),
  keyEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Party, damlTypes.Text).encode(__typed__); },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, revenueShareBps: damlTypes.Int.decoder, dueDate: damlTypes.Time.decoder, lateInterestBpsPerDay: damlTypes.Int.decoder, lastAccrual: damlTypes.Time.decoder, tranches: damlTypes.List(exports.Tranche).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    revenueShareBps: damlTypes.Int.encode(__typed__.revenueShareBps),
    dueDate: damlTypes.Time.encode(__typed__.dueDate),
    lateInterestBpsPerDay: damlTypes.Int.encode(__typed__.lateInterestBpsPerDay),
    lastAccrual: damlTypes.Time.encode(__typed__.lastAccrual),
    tranches: damlTypes.List(exports.Tranche).encode(__typed__.tranches),
  };
}
,
  Loan_SweepRevenue: {
    template: function () { return exports.SyndicatedLoan; },
    choiceName: 'Loan_SweepRevenue',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Loan_SweepRevenue.decoder; }),
    argumentEncode: function (__typed__) { return exports.Loan_SweepRevenue.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.SyndicatedLoan)), damlTypes.Optional(damlTypes.ContractId(Kyd_Cash.Cash))).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.SyndicatedLoan)), damlTypes.Optional(damlTypes.ContractId(Kyd_Cash.Cash))).encode(__typed__); },
  },
  Loan_SettleRevenue: {
    template: function () { return exports.SyndicatedLoan; },
    choiceName: 'Loan_SettleRevenue',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Loan_SettleRevenue.decoder; }),
    argumentEncode: function (__typed__) { return exports.Loan_SettleRevenue.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.SyndicatedLoan)), damlTypes.Optional(damlTypes.ContractId(Kyd_Cash.Cash))).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Optional(damlTypes.ContractId(exports.SyndicatedLoan)), damlTypes.Optional(damlTypes.ContractId(Kyd_Cash.Cash))).encode(__typed__); },
  },
  Loan_Distribute: {
    template: function () { return exports.SyndicatedLoan; },
    choiceName: 'Loan_Distribute',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Loan_Distribute.decoder; }),
    argumentEncode: function (__typed__) { return exports.Loan_Distribute.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Optional(damlTypes.ContractId(exports.SyndicatedLoan)).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Optional(damlTypes.ContractId(exports.SyndicatedLoan)).encode(__typed__); },
  },
  Loan_AccrueLateInterest: {
    template: function () { return exports.SyndicatedLoan; },
    choiceName: 'Loan_AccrueLateInterest',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Loan_AccrueLateInterest.decoder; }),
    argumentEncode: function (__typed__) { return exports.Loan_AccrueLateInterest.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.SyndicatedLoan).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.SyndicatedLoan).encode(__typed__); },
  },
  Loan_OfferTranche: {
    template: function () { return exports.SyndicatedLoan; },
    choiceName: 'Loan_OfferTranche',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Loan_OfferTranche.decoder; }),
    argumentEncode: function (__typed__) { return exports.Loan_OfferTranche.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.TrancheOffer).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.TrancheOffer).encode(__typed__); },
  },
  Loan_ExecuteTrancheTransfer: {
    template: function () { return exports.SyndicatedLoan; },
    choiceName: 'Loan_ExecuteTrancheTransfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Loan_ExecuteTrancheTransfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.Loan_ExecuteTrancheTransfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.SyndicatedLoan).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.SyndicatedLoan).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.SyndicatedLoan; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.SyndicatedLoan, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.OpenCommitment_SettleToVenue = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.OpenCommitment_Uncommit = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.OpenCommitment = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Tix:OpenCommitment',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, lender: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, amount: damlTypes.Numeric(10).decoder, locked: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    lender: damlTypes.Party.encode(__typed__.lender),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    locked: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.locked),
  };
}
,
  OpenCommitment_Uncommit: {
    template: function () { return exports.OpenCommitment; },
    choiceName: 'OpenCommitment_Uncommit',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.OpenCommitment_Uncommit.decoder; }),
    argumentEncode: function (__typed__) { return exports.OpenCommitment_Uncommit.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(Kyd_Cash.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__); },
  },
  OpenCommitment_SettleToVenue: {
    template: function () { return exports.OpenCommitment; },
    choiceName: 'OpenCommitment_SettleToVenue',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.OpenCommitment_SettleToVenue.decoder; }),
    argumentEncode: function (__typed__) { return exports.OpenCommitment_SettleToVenue.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(Kyd_Cash.Cash).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.OpenCommitment; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.OpenCommitment, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.Listing_Activate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({commitmentCids: damlTypes.List(damlTypes.ContractId(exports.OpenCommitment)).decoder, }); }),
  encode: function (__typed__) {
  return {
    commitmentCids: damlTypes.List(damlTypes.ContractId(exports.OpenCommitment)).encode(__typed__.commitmentCids),
  };
}
,
};



exports.Listing_Cancel = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Listing_Commit = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({lender: damlTypes.Party.decoder, cashCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    lender: damlTypes.Party.encode(__typed__.lender),
    cashCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.cashCid),
  };
}
,
};



exports.OpenOfferingListing = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Tix:OpenOfferingListing',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, public: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, target: damlTypes.Numeric(10).decoder, factorRateBps: damlTypes.Int.decoder, revenueShareBps: damlTypes.Int.decoder, dueDate: damlTypes.Time.decoder, lateInterestBpsPerDay: damlTypes.Int.decoder, raised: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    public: damlTypes.Party.encode(__typed__.public),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    target: damlTypes.Numeric(10).encode(__typed__.target),
    factorRateBps: damlTypes.Int.encode(__typed__.factorRateBps),
    revenueShareBps: damlTypes.Int.encode(__typed__.revenueShareBps),
    dueDate: damlTypes.Time.encode(__typed__.dueDate),
    lateInterestBpsPerDay: damlTypes.Int.encode(__typed__.lateInterestBpsPerDay),
    raised: damlTypes.Numeric(10).encode(__typed__.raised),
  };
}
,
  Listing_Commit: {
    template: function () { return exports.OpenOfferingListing; },
    choiceName: 'Listing_Commit',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Listing_Commit.decoder; }),
    argumentEncode: function (__typed__) { return exports.Listing_Commit.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.OpenOfferingListing), damlTypes.ContractId(exports.OpenCommitment)).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.OpenOfferingListing), damlTypes.ContractId(exports.OpenCommitment)).encode(__typed__); },
  },
  Listing_Cancel: {
    template: function () { return exports.OpenOfferingListing; },
    choiceName: 'Listing_Cancel',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Listing_Cancel.decoder; }),
    argumentEncode: function (__typed__) { return exports.Listing_Cancel.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Listing_Activate: {
    template: function () { return exports.OpenOfferingListing; },
    choiceName: 'Listing_Activate',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Listing_Activate.decoder; }),
    argumentEncode: function (__typed__) { return exports.Listing_Activate.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.SyndicatedLoan), damlTypes.List(damlTypes.ContractId(Kyd_Cash.Cash))).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.SyndicatedLoan), damlTypes.List(damlTypes.ContractId(Kyd_Cash.Cash))).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.OpenOfferingListing; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.OpenOfferingListing, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.Offering_Activate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Offering_Cancel = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Offering_Uncommit = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({lender: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    lender: damlTypes.Party.encode(__typed__.lender),
  };
}
,
};



exports.Offering_Commit = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({lender: damlTypes.Party.decoder, cashCid: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    lender: damlTypes.Party.encode(__typed__.lender),
    cashCid: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.cashCid),
  };
}
,
};



exports.FinancingOffering = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Tix:FinancingOffering',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, venue: damlTypes.Party.decoder, eventId: damlTypes.Text.decoder, target: damlTypes.Numeric(10).decoder, factorRateBps: damlTypes.Int.decoder, revenueShareBps: damlTypes.Int.decoder, dueDate: damlTypes.Time.decoder, lateInterestBpsPerDay: damlTypes.Int.decoder, invited: damlTypes.List(damlTypes.Party).decoder, commitments: damlTypes.List(exports.LenderCommitment).decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    venue: damlTypes.Party.encode(__typed__.venue),
    eventId: damlTypes.Text.encode(__typed__.eventId),
    target: damlTypes.Numeric(10).encode(__typed__.target),
    factorRateBps: damlTypes.Int.encode(__typed__.factorRateBps),
    revenueShareBps: damlTypes.Int.encode(__typed__.revenueShareBps),
    dueDate: damlTypes.Time.encode(__typed__.dueDate),
    lateInterestBpsPerDay: damlTypes.Int.encode(__typed__.lateInterestBpsPerDay),
    invited: damlTypes.List(damlTypes.Party).encode(__typed__.invited),
    commitments: damlTypes.List(exports.LenderCommitment).encode(__typed__.commitments),
  };
}
,
  Offering_Commit: {
    template: function () { return exports.FinancingOffering; },
    choiceName: 'Offering_Commit',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Offering_Commit.decoder; }),
    argumentEncode: function (__typed__) { return exports.Offering_Commit.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.FinancingOffering).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.FinancingOffering).encode(__typed__); },
  },
  Offering_Cancel: {
    template: function () { return exports.FinancingOffering; },
    choiceName: 'Offering_Cancel',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Offering_Cancel.decoder; }),
    argumentEncode: function (__typed__) { return exports.Offering_Cancel.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Offering_Uncommit: {
    template: function () { return exports.FinancingOffering; },
    choiceName: 'Offering_Uncommit',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Offering_Uncommit.decoder; }),
    argumentEncode: function (__typed__) { return exports.Offering_Uncommit.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.FinancingOffering).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.FinancingOffering).encode(__typed__); },
  },
  Offering_Activate: {
    template: function () { return exports.FinancingOffering; },
    choiceName: 'Offering_Activate',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Offering_Activate.decoder; }),
    argumentEncode: function (__typed__) { return exports.Offering_Activate.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.SyndicatedLoan), damlTypes.List(damlTypes.ContractId(Kyd_Cash.Cash))).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.SyndicatedLoan), damlTypes.List(damlTypes.ContractId(Kyd_Cash.Cash))).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.FinancingOffering; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.FinancingOffering, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.LenderCommitment = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({lender: damlTypes.Party.decoder, amount: damlTypes.Numeric(10).decoder, locked: damlTypes.ContractId(Kyd_Cash.Cash).decoder, }); }),
  encode: function (__typed__) {
  return {
    lender: damlTypes.Party.encode(__typed__.lender),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    locked: damlTypes.ContractId(Kyd_Cash.Cash).encode(__typed__.locked),
  };
}
,
};



exports.Tranche = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({lender: damlTypes.Party.decoder, outstanding: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    lender: damlTypes.Party.encode(__typed__.lender),
    outstanding: damlTypes.Numeric(10).encode(__typed__.outstanding),
  };
}
,
};

