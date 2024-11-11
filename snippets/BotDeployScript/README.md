## Default instructions (feel free to change as you see fit)

- The `deploy-bots.ts` file should be placed in the `scripts` directory
- The `esbuild-script.mjs` file should be placed in the root of the project
- You will need to setup the `DEPLOY_MEDPLUM_CLIENT_ID` and `DEPLOY_MEDPLUM_CLIENT_SECRET` environment variables
  - Notice that the ProjectMembership associated to the Medplum Client must have Admin privileges
- Your bots should be placed in the `src/bots` directory

### Example `package.json` configuration

```json
{
    ...
    "scripts": {
        ...
        "bots:build": "npm run clean && tsc && node --no-warnings esbuild-script.mjs",
        "bots:deploy": "node --loader ts-node/esm scripts/deploy-bots.ts",
    }
}

```
