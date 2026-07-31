// test.setup.ts deliberately does not call indexStructureDefinitionBundle, because MockClient
// indexes those bundles itself on its first write. That decision rests entirely on the
// behaviour asserted here -- if a future @medplum/mock stops doing it, this fails and the
// explicit indexing needs to come back.
import { tryGetDataType, validateResource } from '@medplum/core';
import { MockClient } from '@medplum/mock';
import { describe, expect, it } from 'vitest';

describe('structure definitions', () => {
  it('are indexed by MockClient on its first write', async () => {
    const medplum = new MockClient();
    await medplum.createResource({
      resourceType: 'Patient',
      name: [{ given: ['Erin'], family: 'Autoindexfamilyname' }],
    });

    expect(tryGetDataType('Patient')).toBeDefined();
    expect(tryGetDataType('Observation')).toBeDefined();
  });

  it('make validateResource work once a resource has been created', async () => {
    const medplum = new MockClient();
    await medplum.createResource({
      resourceType: 'Patient',
      name: [{ given: ['Frank'], family: 'Validatefamilyname' }],
    });

    expect(() => validateResource({ resourceType: 'Patient', birthDate: '1990-05-15' })).not.toThrow();
    // And still rejects what it should, rather than passing everything.
    expect(() => validateResource({ resourceType: 'Patient', birthDate: 12345 } as never)).toThrow();
  });
});
