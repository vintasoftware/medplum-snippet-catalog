import { RelatedPerson, Patient, Encounter, Extension } from '@medplum/fhirtypes';

export type GraphQLQueryResponsePatient = Pick<Patient, 'id' | 'photo' | 'name'> & {
  RelatedPersonList: RelatedPerson[];
  lastEncounter: [Pick<Encounter, 'period'>];
  joinDate: Extension[];
  status: Extension[];
};

export interface GraphQLQueryResponse {
  data: {
    PatientConnection: {
      count: number;
      offset: number;
      pageSize: number;
      edges: {
        resource: GraphQLQueryResponsePatient;
      }[];
    };
  };
  errors?: {
    message: string;
  }[];
}

export const graphqlQuery = `
query PaginatedQuery($offset: Int, $count: Int, $filters: String, $relatedPersonFilters: String, $sort: String) {
  PatientConnection(_offset: $offset, _count: $count, _filter: $filters, _sort: $sort) {
    count
    offset
    pageSize
    edges {
      resource {
        resourceType
        id
        photo {
          url
        }
        status: extension(url: "") {
          valueString
        }
        joinDate: extension(url: "") {
          valueDateTime
        }
        name {
          family
          given
        }
        RelatedPersonList(_reference: patient, active: "true", _filter: $relatedPersonFilters) {
          name {
            family
            given
          }
        }
        lastEncounter: EncounterList(_reference: subject, _sort: "-date", _count: 1) {
          period {
            end
          }
        }
      }
    }
  }
}`;
