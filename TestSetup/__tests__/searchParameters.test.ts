// The guarantee this snippet exists to provide: MockClient search filtering actually filters.
// Without the search parameter index in place, these filters silently match nothing, which is
// far worse than an error because tests keep passing against the wrong data.
import { globalSchema } from '@medplum/core';
import { Patient } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { beforeEach, describe, expect, it } from 'vitest';

// Distinctive values, because MockClient seeds a handful of resources of its own.
const MRN_SYSTEM = 'http://example.com/snippet-catalog/mrn';
const ALICE_FAMILY = 'Alphafamilyname';
const BOB_FAMILY = 'Betafamilyname';

let medplum: MockClient;
let alice: Patient;

beforeEach(async () => {
  medplum = new MockClient();
  alice = await medplum.createResource<Patient>({
    resourceType: 'Patient',
    name: [{ given: ['Alice'], family: ALICE_FAMILY }],
    birthDate: '1990-05-15',
    gender: 'female',
    identifier: [{ system: MRN_SYSTEM, value: 'MRN-1' }],
    telecom: [{ system: 'email', value: 'alice@example.com' }],
  });
  await medplum.createResource<Patient>({
    resourceType: 'Patient',
    name: [{ given: ['Bob'], family: BOB_FAMILY }],
    birthDate: '1975-01-02',
    gender: 'male',
    identifier: [{ system: MRN_SYSTEM, value: 'MRN-2' }],
  });
});

describe('search parameter index', () => {
  it('is populated in this worker', () => {
    // Guards against test.globalSetup.ts providing an empty index, or test.setup.ts
    // injecting it into the wrong place.
    expect(Object.keys(globalSchema.types).length).toBeGreaterThan(100);
    expect(globalSchema.types.Patient?.searchParams?.family).toBeDefined();
    expect(globalSchema.types.Patient?.searchParams?.birthdate).toBeDefined();
    expect(globalSchema.types.Observation?.searchParams?.subject).toBeDefined();
  });
});

describe('MockClient search filtering', () => {
  it('filters on a string parameter', async () => {
    const found = await medplum.searchResources('Patient', `family=${BOB_FAMILY}`);
    expect(found).toHaveLength(1);
    expect(found[0].name?.[0]?.given?.[0]).toBe('Bob');
  });

  it('filters on a token parameter', async () => {
    expect(await medplum.searchResources('Patient', `identifier=${MRN_SYSTEM}|MRN-1`)).toHaveLength(1);
    expect(await medplum.searchResources('Patient', 'email=alice@example.com')).toHaveLength(1);
  });

  it('filters on a date parameter, with and without a prefix', async () => {
    expect(await medplum.searchResources('Patient', 'birthdate=1990-05-15')).toHaveLength(1);
    expect(await medplum.searchResources('Patient', 'birthdate=gt1980-01-01')).toHaveLength(1);
  });

  it('filters on a reference parameter', async () => {
    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '29463-7' }] },
      subject: { reference: `Patient/${alice.id}` },
      valueQuantity: { value: 70, unit: 'kg' },
      effectiveDateTime: '2024-03-01T10:00:00Z',
    });
    expect(await medplum.searchResources('Observation', `subject=Patient/${alice.id}`)).toHaveLength(1);
  });

  it('filters on a choice-of-type parameter', async () => {
    // `date` on Observation resolves through effective[x], so this exercises the FHIRPath
    // path that reads @medplum/core's internal type store.
    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '8302-2' }] },
      subject: { reference: `Patient/${alice.id}` },
      effectiveDateTime: '2024-03-01T10:00:00Z',
    });
    const recent = await medplum.searchResources('Observation', 'date=gt2023-01-01');
    expect(recent.length).toBeGreaterThanOrEqual(1);
    expect(await medplum.searchResources('Observation', 'date=gt2099-01-01')).toHaveLength(0);
  });

  it('returns nothing for a value that does not exist', async () => {
    // The failure mode this snippet prevents is "everything matches" / "nothing matches"
    // regardless of the filter, so pin the negative case too.
    expect(await medplum.searchResources('Patient', 'family=Nosuchfamilyname')).toHaveLength(0);
  });

  it('supports searchOne', async () => {
    const one = await medplum.searchOne('Patient', `family=${ALICE_FAMILY}`);
    expect(one?.name?.[0]?.given?.[0]).toBe('Alice');
  });
});
