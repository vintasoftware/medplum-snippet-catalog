# TestSetup

## About

These files configure the testing environment for Medplum projects. They ensure that searches work properly when using the `MockClient`. Without this setup, filtering may not work correctly for functions like `searchResources` and `searchOne`, leading to unexpected query behavior.

The setup is split in two:

| File                  | Runs                             | Does                                                             |
| --------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `test.globalSetup.ts` | once, in the Vitest main process | polyfills `WebSocket`, indexes the bundles, shares the search parameter index |
| `test.setup.ts`       | once per test worker             | picks up the shared index                                        |

> [!IMPORTANT]
> Make sure all `@medplum/*` packages are using the same version to avoid compatibility issues.

## Why two files

`indexSearchParameterBundle` populates `globalSchema.types`, a `Record<string, { searchParams, searchParamsDetails }>` of plain JSON. That is what `MockClient` search matching reads — with it missing, a filter like `family=Jones` or `birthdate=1990-05-15` silently matches nothing.

A Vitest `globalSetup` runs in the main process, while tests run in workers with their own module registry, so module-level state does not propagate on its own. But because `globalSchema.types` is plain data, it can be handed across with `project.provide` / `inject`, which is what these two files do. Each worker then starts with a complete search parameter index without re-reading or re-parsing the ~2.5 MB of search parameter bundles.

## Why structure definitions are not indexed

`indexStructureDefinitionBundle` fills a second, module-private store inside `@medplum/core` (`DATA_TYPES` in `typeschema/types.ts`) that `provide` cannot reach. It is deliberately **not** called in `test.setup.ts`, because `MockClient` indexes those bundles itself on its first write. Adding an explicit call only moves the same ~35 MB parse of `profiles-resources.json` earlier.

Search matching does not depend on that store at all. When it is empty, FHIRPath property traversal falls back to a schema-less path that probes `value` plus each known property type, so choice-of-type elements such as `value[x]` and `effective[x]` still resolve to the correct type.

The one thing that does depend on it is validation. Calling `validateResource` before any resource has been created throws `Unknown data type: <ResourceType>`. If a test needs validation without touching `MockClient` first, index the bundles in that test:

```ts
import { indexStructureDefinitionBundle } from '@medplum/core';
import { readJson } from '@medplum/definitions';
import { Bundle } from '@medplum/fhirtypes';

indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
indexStructureDefinitionBundle(readJson('fhir/r4/profiles-medplum.json') as Bundle);
```

## Tests

This snippet has its own tests in [`__tests__`](__tests__), run with `npm test` from the repository root. They exist because the setup fails *silently* when it is wrong — searches return zero results rather than raising — so a regression is easy to ship and hard to notice.

| File | Protects |
| ---- | -------- |
| `searchParameters.test.ts` | filtering actually filters, across string, token, date, reference and choice-of-type parameters, plus the negative case |
| `moduleScopeFixtures.test.ts` | the index is in place before a test file's module body runs, not just before its hooks |
| `structureDefinitions.test.ts` | `MockClient` still indexes structure definitions on its first write, which is the assumption that lets `test.setup.ts` skip them |

The suite was checked by mutation rather than just by passing:

| Break | Caught by |
| ----- | --------- |
| move the assignment back inside `beforeAll` | `moduleScopeFixtures.test.ts` (and only that file) |
| drop `setupFiles` from the Vitest config | 8 of 11 tests |
| drop `globalSetup` from the Vitest config | all 3 files, with the actionable error message |

Verified on Vitest 3.2.7 with `pool: 'forks'` and `pool: 'threads'`, `isolate` both true and false.

## Requirements

- Vitest 3+ (`TestProject` and `project.provide` come from `vitest/node`).
- `@medplum/definitions` as a dev dependency, alongside `@medplum/core`.
- Node >= 22.4, **or** `ws` as a dev dependency. `@medplum/core` v5 references `WebSocket` at module-load time, and it is only guaranteed as a global from Node 22.4 on. That is also why `test.globalSetup.ts` imports `@medplum/core` dynamically — the polyfill has to be installed before the module is evaluated.

## Usage

### Vitest

Update `vitest.config.ts` to point at both files:

```ts
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      ...
      globalSetup: ['./src/test.globalSetup.ts'],  // Add this line
      setupFiles: ['./src/test.setup.ts'],         // Add this line
      ...
    },
  })
);
```

Both are required. `globalSetup` alone builds the index in a process the tests never see; `setupFiles` alone has nothing to inject and fails fast with a message telling you so.

`test.setup.ts` imports `inject` explicitly, so it works whether or not `test.globals` is enabled. Verified on Vitest 3.2.7 with `pool: 'forks'` and `pool: 'threads'`, `isolate` both true and false.

### Why the assignment is not inside `beforeAll`

Vitest runs setup files once per test file, in the worker, so no per-test wiring is needed. But a test file's own module body is evaluated *after* the setup file's module body and *before* any `beforeAll` hook the setup file registered. Assigning inside `beforeAll` therefore breaks fixtures built at module scope:

```ts
const medplum = new MockClient();
await medplum.createResource({ resourceType: 'Patient', name: [{ family: 'Xu' }] });
const preloaded = await medplum.searchResources('Patient', 'family=Xu'); // 0 results
```

Doing it at module scope covers both cases, which is why `test.setup.ts` has no hook at all.
