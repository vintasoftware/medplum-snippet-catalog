import React, { useEffect, useState } from "react";

import {
  deepEquals,
  getElementDefinition,
  getExtensionValue,
  getTypedPropertyValue,
  stringify,
  TypedValue,
} from "@medplum/core";
import {
  CodeableConcept,
  QuestionnaireItem,
  QuestionnaireItemInitial,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from "@medplum/fhirtypes";
import { CodingInput, ResourcePropertyDisplay } from "@medplum/react";

import { Radio } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";

import QuestionnaireCheckboxField from "./QuestionnaireCheckBoxField";


interface QuestionnaireChoiceInputProps {
  readonly name: string;
  readonly label: string;
  readonly item: QuestionnaireItem;
  readonly initial: QuestionnaireItemInitial | undefined;
  readonly response?: QuestionnaireResponseItem;
  readonly onChangeAnswer: (
    newResponseAnswer: QuestionnaireResponseItemAnswer | QuestionnaireResponseItemAnswer[],
  ) => void;
}

enum FormControlType {
  CheckBox = "check-box",
}
interface QuestionnaireChoiceFieldProps<T> {
  name: string;
  label: string;
  questionnaireItem: QuestionnaireItem;
  response?: QuestionnaireResponseItem;
  form: UseFormReturnType<T>;
  onChangeAnswer: (
    newResponseAnswer: QuestionnaireResponseItemAnswer | QuestionnaireResponseItemAnswer[],
  ) => void;
}

const QuestionnaireChoiceField = <T,>({
  questionnaireItem,
  name,
  onChangeAnswer,
  response,
  label,
  form,
}: QuestionnaireChoiceFieldProps<T>) => {
  const formControlCodeableConcept = getExtensionValue(
    questionnaireItem,
    "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl", 
  ) as CodeableConcept | undefined;
  const formControlType = formControlCodeableConcept?.coding?.[0]?.code;

  if (formControlType === FormControlType.CheckBox)
    return (
      <QuestionnaireCheckboxField label={label} form={form} group={questionnaireItem} name={name} />
    );

  if (questionnaireItem.answerValueSet) {
    return (
      <CodingInput
        defaultValue={getCurrentAnswer(response)?.value}
        path=""
        name={name}
        label={label}
        withHelpText={false}
        onChange={(code) => onChangeAnswer({ valueCoding: code })}
        binding={questionnaireItem.answerValueSet}
      />
    );
  }

  return (
    <QuestionnaireChoiceRadioInput
      response={response}
      name={name}
      label={label}
      item={questionnaireItem}
      onChangeAnswer={onChangeAnswer}
      initial={undefined}
    />
  );
};

function getItemValue(answer: QuestionnaireResponseItemAnswer): TypedValue {
  const itemValue = getTypedPropertyValue(
    { type: "QuestionnaireItemAnswer", value: answer },
    "value",
  ) as TypedValue;
  return itemValue;
}

function getCurrentAnswer(
  response: QuestionnaireResponseItem | undefined,
  index: number = 0,
): TypedValue {
  const results = response?.answer;
  return getItemValue(results?.[index] ?? {});
}

function getCurrentRadioAnswer(
  options: [string, TypedValue][],
  defaultAnswer: TypedValue,
): string | undefined {
  return options.find((option) => deepEquals(option[1].value, defaultAnswer?.value))?.[0];
}

function QuestionnaireChoiceRadioInput(props: QuestionnaireChoiceInputProps): JSX.Element {
  const { name, item, initial, onChangeAnswer, label, response } = props;
  const valueElementDefinition = getElementDefinition("QuestionnaireItemAnswerOption", "value[x]");
  const initialValue = getTypedPropertyValue(
    { type: "QuestionnaireItemInitial", value: initial },
    "value",
  ) as TypedValue | undefined;

  const options: [string, TypedValue][] = [];

  let defaultValue: string | undefined = undefined;

  if (item.answerOption) {
    for (let i = 0; i < item.answerOption.length; i++) {
      const option = item.answerOption[i];
      const optionName = `${name}-option-${i}`;
      const optionValue = getTypedPropertyValue(
        { type: "QuestionnaireItemAnswerOption", value: option },
        "value",
      ) as TypedValue;

      if (!optionValue?.value) {
        continue;
      }

      if (initialValue && stringify(optionValue) === stringify(initialValue)) {
        defaultValue = optionName;
      }
      options.push([optionName, optionValue]);
    }
  }

  const defaultAnswer = getCurrentAnswer(response);
  const answerLinkId = getCurrentRadioAnswer(options, defaultAnswer);

  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    answerLinkId ?? defaultValue,
  );

  useEffect(() => {
    setSelectedValue(answerLinkId ?? defaultValue);
  }, [answerLinkId, defaultValue]);

  return (
    <Radio.Group
      label={label}
      name={name}
      value={selectedValue}
      onChange={(newValue) => {
        const option = options.find((option) => option[0] === newValue);
        if (option) {
          setSelectedValue(newValue);
          const optionValue = option[1];
          onChangeAnswer(optionValue.value);
        }
      }}
    >
      {options.map(([optionName, optionValue]) => (
        <Radio
          key={optionName}
          id={optionName}
          value={optionName}
          py={4}
          label={
            <ResourcePropertyDisplay
              property={valueElementDefinition}
              propertyType={optionValue.type}
              value={optionValue.value}
            />
          }
        />
      ))}
    </Radio.Group>
  );
}

export default QuestionnaireChoiceField;
