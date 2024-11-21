# Upload Core Data Page

Administrative interface for importing FHIR data and related scripts into your project.

## Overview

This tool provides a streamlined way for developers to import FHIR resources and manage FHIR-related scripts through a dedicated admin page.

## Features

- Admin-only access control
- Automatic data imports from specified directories
- Idempotent uploads to prevent duplicates
- Structured data organization

## Prerequisites

- Admin access to the project (verified through `medplumClient.isProjectAdmin`)
- Properly formatted FHIR JSON files
- Correct directory structure setup

## Installation

1. Set up your data directory structure:
```
/data/
  └── fhir/
      └── seed-data/
          └── *.json
```

2. Ensure you have admin permissions for your project

## Usage

1. Place your FHIR JSON files in the `/data/fhir/seed-data/` directory
2. Access the admin page
3. Files will be automatically processed when added to the directory

## File Structure

Files must follow this path pattern:
```
/data/fhir/seed-data/**/*.json
```

## Limitations

- Updates to existing documents are not supported
- To modify an existing resource:
  1. Delete the original resource
  2. Add the updated version as a new file

## Security

Access is restricted to project administrators only. Verification is handled through the Medplum SDK:
```typescript
medplumClient.isProjectAdmin
```

## Documentation

For more information about admin permissions, see:
https://www.medplum.com/docs/sdk/core.medplumclient.isprojectadmin