import { Extension } from '@medplum/fhirtypes';

export interface BotDescription {
  name: string;
  criteria?: string;
  extension?: Extension[];
  questionnaires?: string[];
  needsAdminMembership?: boolean;
}

export const BOTS: BotDescription[] = [
  {
    name: 'care-team-member-access-policy-bot',
    criteria: 'CareTeam',
    needsAdminMembership: true,
  },
  {
    name: 'patient-intake-bot',
    criteria: 'QuestionnaireResponse?questionnaire=$patient-intake-questionnaire',
    extension: [getSubscriptionExtension('create')],
    questionnaires: ['patient-intake-questionnaire'],
  },
];

/**
 * Returns an extension for the supported interaction of a Subscription.
 *
 * | ValueCode | Description |
 * |-----------|-------------|
 * | create    | Create Only |
 * | update    | Update Only |
 * | delete    | Delete Only |
 * | undefined | All Interactions |
 */
function getSubscriptionExtension(valueCode: 'create' | 'update' | 'delete' | undefined): Extension {
  return {
    url: 'https://medplum.com/fhir/StructureDefinition/subscription-supported-interaction',
    valueCode,
  };
}
