# TestSetup

## About

The `test.setup.ts` file configures the testing environment for Medplum projects. It ensures that searches work properly when using the `MockClient`. Without this setup, filtering may not work correctly for functions like `searchResources` and `searchOne`, leading to unexpected query behavior.


> [!IMPORTANT]
> Make sure all @medplum/* packages are using the same version to avoid compatibility issues.

## Usage

### Vitest

With Vitest, update the `vitest.config.ts` file as shown below. Set the `setupFiles` property to point to `test.setup.ts`.

```ts
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      ...
      setupFiles: ['./src/test.setup.ts'],  // Add this line
      ...
    },
  })
);
```
