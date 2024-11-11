import { Extension } from '@medplum/fhirtypes';

export interface BotDescription {
  name: string;
  criteria?: string;
  extension?: Extension[];
  needsAdminMembership?: boolean;
}

export const BOTS: BotDescription[] = [
  {
    name: 'care-team-member-access-policy-bot',
    criteria: 'CareTeam',
    needsAdminMembership: true,
  },
];
