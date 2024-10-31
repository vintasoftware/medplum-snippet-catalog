# Form Component

A flexible form component built on top of Medplum's form components with support for nested fields, validation, and various input types.
The goal is make it easy to organize form fields in the shape of any desired object. By doing that it becomes easy to generate outputs
that are compliant with any FHIR resource and can be directly used to create and update Medplum resources.

## Basic Usage

```tsx
import { Form } from './Form';
function MyTaskForm() {
  const handleSubmit = (formData, error) => {
    // error is null if there are no validation errors
    // for now we only validate required fields
    console.log('Form has validation errors:', error);

    /*
     * Expected formData object structure:
     * {
     *  owner: {
     *    reference: 'Practitioner/123'
     *  },
     *  description: '...'
     * }
     */
    console.log('Form data:', formData);
  };
  return (
    <Form onSubmit={handleSubmit}>
      {({ onChange, defaultData }) => (
        <>
          <Form.ResourceInput
            label="Owner" // label is used to display in the UI
            name="owner" // name is used to identify the field in the final form data object
            onChange={onChange} // forwards the onChange from the parent
            defaultValue={defaultData?.owner} // defaultValue needs to be explicitly passed to fields
            resourceType="Practitioner" // resourceType is a specific field for ResourceInput component
          />
          <Form.TextArea
            name="description"
            label="Description"
            onChange={onChange}
            defaultValue={defaultData?.notes}
            required
          />
        </>
      )}
    </Form>
  );
}
```

## Nested Fields

NestedField has two uses:

1. Allowing forms with nested objects (e.g.: `{ period: { start: '2024-01-01', end: '2024-01-02' } }`)
2. Allow creating lists of objects (e.g.: `{ tags: ['tag1', 'tag2'] }`)

```tsx
function CareTeamForm() {
  return (
    <Form>
      {({ onChange, defaultData }) => (
        <Form.NestedField
          label="Members"
          path="participant"
          onChange={onChange}
          defaultData={defaultData?.participant}
          repeats // if true multiple "participant" can be added
        >
          {({ onChange, defaultData }) => (
            <Box>
              <Form.ResourceInput
                label="Practitioner"
                name="member"
                resourceType="Practitioner"
                onChange={onChange}
                defaultValue={defaultData?.member}
                required
              />
              <Form.CodingInput
                label="Role"
                name="role"
                path="role"
                binding="http://hl7.org/fhir/ValueSet/practitioner-role"
                onChange={onChange}
                // notice in some situations we need to access deeply nested data
                // in order to set the right defaultValue
                defaultValue={defaultData?.role?.[0]?.coding?.[0]}
                required
              />
            </Box>
          )}
        </Form.NestedField>
      )}
    </Form>
  );
}
```

## ResourceForm Component

The ResourceForm component is a higher-level wrapper around the base Form component that provides built-in functionality for creating and updating Medplum resources. It handles resource fetching, data transformation, and submission to the Medplum API.

### Basic Usage

```tsx
import { ResourceForm } from './Form';
function PatientForm() {
  return (
    <ResourceForm<Patient>
      // Optional: Provide default data to pre populate the form
      // it can also be used to provide the default structure of a resource
      // in case it's being created.
      // The object can have any number of properties. Properties don't necessarily need to be
      // represented in the form fields.
      defaultData={{
        resourceType: 'Patient',
      }}
      // Optional: Tell ResourceForm how to fetch the resource
      // if it's not provided the defaultData will be used to populate the form
      fetchResource={async () => {
        return medplum.readResource('Patient', 'patient-id');
      }}
      // Optional: Transform resource data so it complies with the form field structure
      // this is useful when the resource structure is not exactly what we want to use in the form
      resourceToFormData={(resource) => ({
        name: resource.name?.[0]?.given?.[0],
        birthDate: resource.birthDate,
      })}
      // Optional: Transform form data from the form field structure to the resource structure
      // this is useful when the form fields don't exactly match the resource structure
      formDataToResource={(formData) => ({
        name: [{ given: [formData.name] }],
        birthDate: formData.birthDate,
      })}
      // Optional: Handle successful submission
      onSuccess={(patient) => {
        console.log('Patient saved:', patient);
      }}
    >
      {({ onChange, defaultData }) => (
        <>
          <Form.TextArea name="name" label="First Name" onChange={onChange} defaultValue={defaultData?.name} required />
          <Form.DateTimeInput
            name="birthDate"
            label="Birth Date"
            onChange={onChange}
            defaultValue={defaultData?.birthDate}
          />
        </>
      )}
    </ResourceForm>
  );
}
```
