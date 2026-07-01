// Generated from Kyd/Roles.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7 from '@kyd/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7';
import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@kyd/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

export declare type Membership = {
  operator: damlTypes.Party;
  member: damlTypes.Party;
  role: RoleType;
};

export declare interface MembershipInterface {
  Archive: damlTypes.Choice<Membership, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, Membership.Key> & damlTypes.ChoiceFrom<damlTypes.Template<Membership, Membership.Key>>;
}
export declare const Membership:
  damlTypes.Template<Membership, Membership.Key, '#kyd-tix:Kyd.Roles:Membership'> &
  damlTypes.ToInterface<Membership, never> &
  MembershipInterface;

export declare namespace Membership {
  export type Key = pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple3<damlTypes.Party, damlTypes.Party, RoleType>
  export type CreateEvent = damlLedger.CreateEvent<Membership, Membership.Key, typeof Membership.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<Membership, typeof Membership.templateId>
  export type Event = damlLedger.Event<Membership, Membership.Key, typeof Membership.templateId>
  export type QueryResult = damlLedger.QueryResult<Membership, Membership.Key, typeof Membership.templateId>
}



export declare type Invitation_Decline = {
};

export declare const Invitation_Decline:
  damlTypes.Serializable<Invitation_Decline> & {
  }
;


export declare type Invitation_Accept = {
};

export declare const Invitation_Accept:
  damlTypes.Serializable<Invitation_Accept> & {
  }
;


export declare type Invitation = {
  operator: damlTypes.Party;
  invitee: damlTypes.Party;
  role: RoleType;
};

export declare interface InvitationInterface {
  Archive: damlTypes.Choice<Invitation, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Invitation, undefined>>;
  Invitation_Decline: damlTypes.Choice<Invitation, Invitation_Decline, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Invitation, undefined>>;
  Invitation_Accept: damlTypes.Choice<Invitation, Invitation_Accept, damlTypes.ContractId<Membership>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Invitation, undefined>>;
}
export declare const Invitation:
  damlTypes.Template<Invitation, undefined, '#kyd-tix:Kyd.Roles:Invitation'> &
  damlTypes.ToInterface<Invitation, never> &
  InvitationInterface;

export declare namespace Invitation {
  export type CreateEvent = damlLedger.CreateEvent<Invitation, undefined, typeof Invitation.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<Invitation, typeof Invitation.templateId>
  export type Event = damlLedger.Event<Invitation, undefined, typeof Invitation.templateId>
  export type QueryResult = damlLedger.QueryResult<Invitation, undefined, typeof Invitation.templateId>
}



export declare type RoleType =
  | 'Venue'
  | 'Artist'
  | 'Fan'
  | 'Lender'
;

export declare const RoleType:
  damlTypes.Serializable<RoleType> & {
  }
& { readonly keys: RoleType[] } & { readonly [e in RoleType]: e }
;

