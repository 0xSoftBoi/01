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


exports.Membership = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Roles:Membership',
  keyDecoder: damlTypes.lazyMemo(function () { return damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple3(damlTypes.Party, damlTypes.Party, exports.RoleType).decoder; }); }),
  keyEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple3(damlTypes.Party, damlTypes.Party, exports.RoleType).encode(__typed__); },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, member: damlTypes.Party.decoder, role: exports.RoleType.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    member: damlTypes.Party.encode(__typed__.member),
    role: exports.RoleType.encode(__typed__.role),
  };
}
,
  Archive: {
    template: function () { return exports.Membership; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.Membership, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.Invitation_Decline = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Invitation_Accept = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Invitation = damlTypes.assembleTemplate(
{
  templateId: '#kyd-tix:Kyd.Roles:Invitation',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, invitee: damlTypes.Party.decoder, role: exports.RoleType.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    invitee: damlTypes.Party.encode(__typed__.invitee),
    role: exports.RoleType.encode(__typed__.role),
  };
}
,
  Archive: {
    template: function () { return exports.Invitation; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Invitation_Decline: {
    template: function () { return exports.Invitation; },
    choiceName: 'Invitation_Decline',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Invitation_Decline.decoder; }),
    argumentEncode: function (__typed__) { return exports.Invitation_Decline.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Invitation_Accept: {
    template: function () { return exports.Invitation; },
    choiceName: 'Invitation_Accept',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Invitation_Accept.decoder; }),
    argumentEncode: function (__typed__) { return exports.Invitation_Accept.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Membership).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Membership).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.Invitation, ['80e4174949b6188511ec439f121c7f284b9cf72d9a2856a76e7627c684e48b2d', '#kyd-tix']);



exports.RoleType = {
  Venue: 'Venue',
  Artist: 'Artist',
  Fan: 'Fan',
  Lender: 'Lender',
  keys: ['Venue','Artist','Fan','Lender',],
  decoder: damlTypes.lazyMemo(function () { return jtv.oneOf(jtv.constant(exports.RoleType.Venue), jtv.constant(exports.RoleType.Artist), jtv.constant(exports.RoleType.Fan), jtv.constant(exports.RoleType.Lender)); }),
  encode: function (__typed__) { return __typed__; },
};

