// Assert that the versions of @medplum/core, @medplum/definitions, @medplum/mock and
// @medplum/fhirtypes match.
import { globalSchema, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson } from '@medplum/definitions';
import { Bundle } from '@medplum/fhirtypes';
import { beforeAll, inject } from 'vitest';

beforeAll(() => {
  // Search parameters were indexed once by test.globalSetup.ts. `globalSchema.types` holds
  // nothing but plain data, so it survives the trip from the main process to this worker.
  // This is what MockClient's search matching reads, so it has to be in place before any
  // searchResources/searchOne call.
  globalSchema.types = inject('globalSchemaTypes');

  // Structure definitions are a different story: indexStructureDefinitionBundle also fills a
  // module-private store inside @medplum/core that `provide` cannot reach, so the bundles still
  // have to be indexed once per worker. Without them FHIRPath evaluation falls back to a
  // schema-less path that mishandles choice-of-type elements (value[x], effective[x], ...) and
  // resource validation does not work at all.
  indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
  indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
  indexStructureDefinitionBundle(readJson('fhir/r4/profiles-medplum.json') as Bundle);
});
