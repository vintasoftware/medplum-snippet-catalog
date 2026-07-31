# TestSetup

## About

These files configure the testing environment for Medplum projects. They ensure that searches work properly when using the `MockClient`. Without this setup, filtering may not work correctly for functions like `searchResources` and `searchOne`, leading to unexpected query behavior.

The setup is split in two:

| File                  | Runs                                 | Does                                                                       |
| --------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `test.globalSetup.ts` | once, in the Vitest main process     | polyfills `WebSocket`, indexes every bundle, shares the search parameter index |
| `test.setup.ts`       | once per test worker                 | picks up the shared index, indexes the structure definitions                |

> [!IMPORTANT]
> Make sure all `@medplum/*` packages are using the same version to avoid compatibility issues.

## Why two files

`indexStructureDefinitionBundle` and `indexSearchParameterBundle` write to **two separate module-level stores** inside `@medplum/core`:

- `globalSchema.types` — a `Record<string, { searchParams, searchParamsDetails }>` of plain JSON. This is what `MockClient` search matching reads.
- an internal type store (`DATA_TYPES` in `typeschema/types.ts`) holding parsed `InternalTypeSchema` objects, used by FHIRPath property traversal and `validateResource`.

A Vitest `globalSetup` runs in the main process, while tests run in workers with their own module registry, so neither store propagates on its own. `globalSchema.types` is plain data and can be passed across with `project.provide` / `inject`, which saves each worker from re-reading and re-indexing the ~2.5 MB of search parameter bundles. The internal type store is not serializable, so `test.setup.ts` still indexes the structure definitions per worker.

If your tests only exercise search matching and never touch validation or choice-of-type (`value[x]`) elements, you can drop the `indexStructureDefinitionBundle` calls from `test.setup.ts` — `profiles-resources.json` alone is ~35 MB, so it is by far the most expensive part of the setup.

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

`test.setup.ts` imports `beforeAll` and `inject` explicitly, so it works whether or not `test.globals` is enabled.
