// Assert that the versions of @medplum/core, @medplum/definitions, @medplum/mock and
// @medplum/fhirtypes match.
import { globalSchema } from '@medplum/core';
import { beforeAll, inject } from 'vitest';

beforeAll(() => {
  // Search parameters were indexed once by test.globalSetup.ts. `globalSchema.types` holds
  // nothing but plain data, so it survives the trip from the main process to this worker.
  // This is what MockClient's search matching reads, and it is the whole reason this file
  // exists: without it, filters like `family=` or `birthdate=` silently match nothing.
  globalSchema.types = inject('globalSchemaTypes');

  // Structure definitions are deliberately *not* indexed here. MockClient indexes them itself
  // on its first write, so doing it up front only moves the same ~35 MB parse earlier.
  // The one exception: calling validateResource (or anything else that reads @medplum/core's
  // internal type store) before any resource has been created throws "Unknown data type".
  // Index them in that individual test if you need it.
});
