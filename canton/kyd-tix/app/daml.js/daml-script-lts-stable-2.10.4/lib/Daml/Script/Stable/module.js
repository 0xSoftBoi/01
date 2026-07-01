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


exports.FailedCmd = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({commandName: exports.CommandName.decoder, errorClassName: exports.ErrorClassName.decoder, errorMessage: exports.ErrorMessage.decoder, }); }),
  encode: function (__typed__) {
  return {
    commandName: exports.CommandName.encode(__typed__.commandName),
    errorClassName: exports.ErrorClassName.encode(__typed__.errorClassName),
    errorMessage: exports.ErrorMessage.encode(__typed__.errorMessage),
  };
}
,
};



exports.ErrorMessage = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({getErrorMessage: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    getErrorMessage: damlTypes.Text.encode(__typed__.getErrorMessage),
  };
}
,
};



exports.ErrorClassName = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({getErrorClassName: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    getErrorClassName: damlTypes.Text.encode(__typed__.getErrorClassName),
  };
}
,
};



exports.CommandName = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({getCommandName: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    getCommandName: damlTypes.Text.encode(__typed__.getCommandName),
  };
}
,
};



exports.UserNotFound = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({userId: exports.UserId.decoder, }); }),
  encode: function (__typed__) {
  return {
    userId: exports.UserId.encode(__typed__.userId),
  };
}
,
};



exports.UserAlreadyExists = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({userId: exports.UserId.decoder, }); }),
  encode: function (__typed__) {
  return {
    userId: exports.UserId.encode(__typed__.userId),
  };
}
,
};



exports.InvalidUserId = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({m: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    m: damlTypes.Text.encode(__typed__.m),
  };
}
,
};



exports.UserRight = {
  decoder: damlTypes.lazyMemo(function () { return jtv.oneOf(jtv.object({tag: jtv.constant('ParticipantAdmin'), value: damlTypes.Unit.decoder, }), jtv.object({tag: jtv.constant('CanActAs'), value: damlTypes.Party.decoder, }), jtv.object({tag: jtv.constant('CanReadAs'), value: damlTypes.Party.decoder, })); }),
  encode: function (__typed__) {
  switch(__typed__.tag) {
    case 'ParticipantAdmin': return {tag: __typed__.tag, value: damlTypes.Unit.encode(__typed__.value)};
    case 'CanActAs': return {tag: __typed__.tag, value: damlTypes.Party.encode(__typed__.value)};
    case 'CanReadAs': return {tag: __typed__.tag, value: damlTypes.Party.encode(__typed__.value)};
    default: throw 'unrecognized type tag: ' + __typed__.tag + ' while serializing a value of type UserRight';
  }
}
,
};



exports.User = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({userId: exports.UserId.decoder, primaryParty: damlTypes.Optional(damlTypes.Party).decoder, }); }),
  encode: function (__typed__) {
  return {
    userId: exports.UserId.encode(__typed__.userId),
    primaryParty: damlTypes.Optional(damlTypes.Party).encode(__typed__.primaryParty),
  };
}
,
};



exports.UserId = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({unpack: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    unpack: damlTypes.Text.encode(__typed__.unpack),
  };
}
,
};



exports.ParticipantName = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({participantName: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    participantName: damlTypes.Text.encode(__typed__.participantName),
  };
}
,
};



exports.PartyIdHint = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({partyIdHint: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    partyIdHint: damlTypes.Text.encode(__typed__.partyIdHint),
  };
}
,
};



exports.PartyDetails = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({party: damlTypes.Party.decoder, displayName: damlTypes.Optional(damlTypes.Text).decoder, isLocal: damlTypes.Bool.decoder, }); }),
  encode: function (__typed__) {
  return {
    party: damlTypes.Party.encode(__typed__.party),
    displayName: damlTypes.Optional(damlTypes.Text).encode(__typed__.displayName),
    isLocal: damlTypes.Bool.encode(__typed__.isLocal),
  };
}
,
};

