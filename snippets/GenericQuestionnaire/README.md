## Generic Questionnaire

### Usage

The `GenericQuestionnaire.tsx` will be the entry point of the component, but you need to specify some configs beforehand.

- In `GenericQuestionnaire/services/questionnaireServices.ts`, you will need to add the URL of the form that you are going to use.
```javascript
export const fetchQuestionnaire = async (medplum: MedplumClient) => {
  // HINT: Add your own questionnaire URL
  const questionnaire = await medplum.searchResources("Questionnaire", {
    url: "add-questionnaire-url", 
  });

  return questionnaire[0];
};
```
- In `GenericQuestionnaire/components/QuestionnaireForm.ts`, it is necessary to create extensions for each `placeholder`, `icon`, and `mask` key.

------------

### Extending the component

- In `GenericQuestionnaire/components/QuestionnaireForm.ts`, if you need more required components, you will need to add them to the `zodValidationOptions` function.

- In `GenericQuestionnaire/constants`, under `VALUE_TYPE_PARSERS`, you will need to add more `valueX` as needed.

- In `GenericQuestionnaire/utils`, in the `handleFormControlAnswer` function, add a new `formControlType` for each new `choice` you add based on the `http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl` extension.
  - You will also need to add the new choice component in `GenericQuestionnaire/components/QuestionnaireChoiceField.ts`.

- In `GenericQuestionnaire/utils`, in the `handleBaseTypeAnswer` function, if you add more types of answers, specify how they need to be saved in the `QuestionnaireResponse`.

- If you need to add more `QuestionnaireItem` types, go to `GenericQuestionnaire/constants` and update `FORMS_FIELDS` by adding more object keys `[string]: ReactNode`.

------------

### Useful Information
- The `Wizard Form` uses the main `group` type of the `QuestionnaireItem` to render the page and the `WizardCounter`. Every nested group will be considered a section of the form.

- The function `getQuestionnaireResponseFromFormValues` inside `GenericQuestionnaire/utils` creates a `QuestionnaireResponse` based on pre-determined values (`Record<string, unknown>`). If you need to create a `QuestionnaireResponse` earlier, you can use this function along with `medplum.createResource`.