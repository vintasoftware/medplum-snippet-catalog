// Regression test for the setup running too late.
//
// Vitest evaluates a test file's module body AFTER the setup file's module body, but BEFORE
// any beforeAll hook the setup file registered. So if test.setup.ts assigns the injected
// schema inside beforeAll, fixtures built at module scope search against an empty index and
// silently match nothing -- while every test that builds its fixtures inside `it` keeps
// passing. That asymmetry is what makes people conclude the setup has to be repeated in each
// test's own beforeAll.
//
// The fixtures below are deliberately at module scope. Do not move them into a hook.
import { MockClient } from '@medplum/mock';
import { expect, it } from 'vitest';

const FAMILY = 'Modulescopefamilyname';

const medplum = new MockClient();
await medplum.createResource({
  resourceType: 'Patient',
  name: [{ given: ['Dana'], family: FAMILY }],
  birthDate: '1988-07-04',
});
const preloadedByFamily = await medplum.searchResources('Patient', `family=${FAMILY}`);
const preloadedByBirthDate = await medplum.searchResources('Patient', 'birthdate=1988-07-04');

it('search parameters are indexed before the test file module body runs', () => {
  expect(preloadedByFamily).toHaveLength(1);
  expect(preloadedByBirthDate).toHaveLength(1);
});
