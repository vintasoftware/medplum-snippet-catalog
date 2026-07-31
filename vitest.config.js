import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Every snippet here talks to Medplum, so the FHIR schema setup applies catalog-wide.
    // See TestSetup/README.md — both entries are required, and each is useless without the other.
    globalSetup: ['./TestSetup/test.globalSetup.ts'],
    setupFiles: ['./TestSetup/test.setup.ts'],
  },
});
