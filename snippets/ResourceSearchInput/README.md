# ResourceSearchInput

An Autocomplete that behaves differently from what's provided by default by Medplum. This component doesn't hold the selected value, but exports it through the `onSelect` prop. The value is meant to be used outside of its scope. This was made to function as a search bar.

![resource-search-input](https://github.com/user-attachments/assets/8391d765-483a-473c-a30e-6f33adbf8df7)

## About

The component requires the following props in order to work:

```tsx
interface ResourceSearchInputProps<K extends ResourceType> extends TextInputProps{
  resourceType: K;
  search: string;
  maxResults?: number;
  minInputLength?: number;
  onSelect: (selected: ExtractResource<K>) => void;
}
```

1. `resourceType` defines the Resource you want to search for;
2. `search` defines which field is going to be used in the search call. A single field was enough for its intended purpose, but the component could be updated to accept multiple fields;
3. `maxResults` limits how many results are shown to the user. This stops the component from rendering a large amount of data, causing slowdowns. Better results will be shown by refining the search;
4. `minInputLength` defaults to `2`, and is used to stop the component from actually searching anything until the user has typed in 2 characters, also improving overall performance;
5. `onSelect` is the function that will be called once a user selects an option. The developer can then use it for any purpose;
6. Since it extends `TextInputProps`, any other Mantine-related prop can be used here to improve the experience (adding a label, changing the placeholder, or using css-related props, for instance).

## Basic Usage

```tsx
<ResourceSearchInput 
  resourceType="Practitioner"
  search="name"
  maxResults={10}
  minInputLength={2}
  onSelect={handleSelect}
/>
```

```tsx
const handleSelect = (selected: ExtractResource<Practitioner>) => {
  /* Example of what `selected` is:

  {
    "resourceType": "Practitioner",
    "meta": {
      "project": "bfbf98b5-0358-427e-8120-a68d38b811bf",
      "versionId": "5b1ea18b-8fbf-4633-ab17-4f1fbf7498da",
      "lastUpdated": "2024-09-25T12:29:46.347Z",
      "author": {
        "reference": "system"
      },
      "compartment": [
        {
          "reference": "Project/bfbf98b5-0358-427e-8120-a68d38b811bf"
        }
      ]
    },
    "name": [
      {
        "given": [
          "Medplum"
        ],
        "family": "Admin"
      }
    ],
    "telecom": [
      {
        "system": "email",
        "use": "work",
        "value": "admin@example.com"
      }
    ],
    "id": "9a7b0803-34e9-4a38-b2c3-e231eb06b166"
  }
  */
}
```
