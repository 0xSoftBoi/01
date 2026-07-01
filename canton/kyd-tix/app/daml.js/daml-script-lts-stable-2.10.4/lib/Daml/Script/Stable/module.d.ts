// Generated from Daml/Script/Stable.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

export declare type FailedCmd = {
  commandName: CommandName;
  errorClassName: ErrorClassName;
  errorMessage: ErrorMessage;
};

export declare const FailedCmd:
  damlTypes.Serializable<FailedCmd> & {
  }
;


export declare type ErrorMessage = {
  getErrorMessage: string;
};

export declare const ErrorMessage:
  damlTypes.Serializable<ErrorMessage> & {
  }
;


export declare type ErrorClassName = {
  getErrorClassName: string;
};

export declare const ErrorClassName:
  damlTypes.Serializable<ErrorClassName> & {
  }
;


export declare type CommandName = {
  getCommandName: string;
};

export declare const CommandName:
  damlTypes.Serializable<CommandName> & {
  }
;


export declare type UserNotFound = {
  userId: UserId;
};

export declare const UserNotFound:
  damlTypes.Serializable<UserNotFound> & {
  }
;


export declare type UserAlreadyExists = {
  userId: UserId;
};

export declare const UserAlreadyExists:
  damlTypes.Serializable<UserAlreadyExists> & {
  }
;


export declare type InvalidUserId = {
  m: string;
};

export declare const InvalidUserId:
  damlTypes.Serializable<InvalidUserId> & {
  }
;


export declare type UserRight =
  |  { tag: 'ParticipantAdmin'; value: {} }
  |  { tag: 'CanActAs'; value: damlTypes.Party }
  |  { tag: 'CanReadAs'; value: damlTypes.Party }
;

export declare const UserRight:
  damlTypes.Serializable<UserRight> & {
  }
;


export declare type User = {
  userId: UserId;
  primaryParty: damlTypes.Optional<damlTypes.Party>;
};

export declare const User:
  damlTypes.Serializable<User> & {
  }
;


export declare type UserId = {
  unpack: string;
};

export declare const UserId:
  damlTypes.Serializable<UserId> & {
  }
;


export declare type ParticipantName = {
  participantName: string;
};

export declare const ParticipantName:
  damlTypes.Serializable<ParticipantName> & {
  }
;


export declare type PartyIdHint = {
  partyIdHint: string;
};

export declare const PartyIdHint:
  damlTypes.Serializable<PartyIdHint> & {
  }
;


export declare type PartyDetails = {
  party: damlTypes.Party;
  displayName: damlTypes.Optional<string>;
  isLocal: boolean;
};

export declare const PartyDetails:
  damlTypes.Serializable<PartyDetails> & {
  }
;

