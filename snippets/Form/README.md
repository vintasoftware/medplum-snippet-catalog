# Form Component

A flexible form component built on top of Medplum's form components with support for nested fields, validation, and various input types.
The goal is make it easy to organize form fields in the shape of any desired object. By doing that it becomes easy to generate outputs
that are compliant with any FHIR resource and can be directly used to create and update Medplum resources.

![Example video](https://github.com/user-attachments/assets/b6b6b718-8fda-4438-a660-1c89fc3b0a0c)

## Basic Usage

```tsx
import { Form } from './Form';
function MyTaskForm() {
  const handleSubmit = (formData, error) => {
    /*
     * error is undefined if there are not validation errors in any of the fields.
     * For now we only validate required fields
     */
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
    <Form
      onSubmit={handleSubmit}
      defaultData={{ owner: { reference: 'Practitioner/123' }, description: 'Default description' }}
    >
      {/*
       * Form component accepts a render prop that receives the following parameters:
       * onChange: a callback function used to update the form data
       * defaultData: the initial value of the field, in this example it will be
       *              the same object passed to the Form component
       */}
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
2. Allow creating lists of objects (e.g.: `{ tags: [{name: 'tag1'}, {name: 'tag2'}] }`)

```tsx
function CareTeamForm() {
  return (
    <Form
      defaultData={{
        participant: [{ member: { reference: 'Practitioner/123' }, role: { coding: [{ code: '123' }] } }],
      }}
    >
      {({ onChange, defaultData }) => (
        <Form.NestedField
          label="Members"
          path="participant"
          onChange={onChange}
          defaultData={defaultData?.participant} // notice we use defaultData here to "step" into the nested object
          repeats // if true multiple "participant" can be added
        >
          {/*
           * Just like the Form component, NestedField component accepts a render prop that receives
           * the same parameters as the Form component:
           * onChange: a callback function used to update the form data
           * defaultData: the initial value of the nested field, in this example it will be
           *              the list of participants passed to the Form component: [{member: ..., role: ...}]
           */}
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
                // notice in some situations we will need to access deeply nested data
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
      /*
       * Optional: Tell ResourceForm how to fetch the resource. If fetchResource is not provided
       * the defaultData will be used to pre populate the form.
       */
      fetchResource={async () => {
        return medplum.readResource('Patient', 'patient-id');
      }}
      /*
       * Optional: defaultData will be used to pre populate the form in case fetchResource is not provided.
       * It can also be used to provide a default structure of a resource when it's being created.
       * The object can have any set of properties and they don't necessarily need to correspond to form fields.
       */
      defaultData={{
        /*
         * by setting the resourceType we instruct ResourceForm to create a new Patient resource.
         * The rest of the properties will be filled with the form data.
         */
        resourceType: 'Patient',
      }}
      /*
       * Optional: Transform resource data so it complies with the form field structure.
       * This is useful when the resource structure does not match the form field structure.
       * Both the defaultData and the data from fetchResource will be transformed before used.
       */
      resourceToFormData={(resource) => ({
        name: resource.name?.[0]?.given?.[0],
        birthDate: resource.birthDate,
      })}
      /*
       * Optional: Transform form data in the form to the desired resource structure.
       * This is useful when the form fields structure doesn't exactly match the resource structure.
       */
      formDataToResource={(formData) => ({
        name: [{ given: [formData.name] }],
        birthDate: formData.birthDate,
      })}
      /*
       * Optional: called after the resource is successfully created or updated.
       */
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
