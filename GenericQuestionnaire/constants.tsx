import React from 'react'

import { ReactElement } from "react";

import { createReference } from "@medplum/core";
import { CodeableConcept, Reference, Resource } from "@medplum/fhirtypes";
import { QuestionnaireItemType, ResourceInput } from "@medplum/react";

import { Checkbox, Stack, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";

import { IconCalendar, IconSearch } from "@tabler/icons-react";
import { parseISO } from "date-fns";


import EnableWhenWrapper from "./components/EnableWhenWrapper";
import MaskInput from './components/MaskInput';
import QuestionnaireChoiceField from './components/QuestionnaireChoiceField';
import QuestionnaireGroupField from './components/QuestionnaireGroupField';
import { FormComponentProps, FormFieldType, FormInitialValuesType } from './types/genericQuestionnaireTypes';

export const FORM_INITIAL_VALUES: Partial<FormInitialValuesType> = {
  [QuestionnaireItemType.string]: "",
  [QuestionnaireItemType.date]: null,
  [QuestionnaireItemType.openChoice]: {},
  [QuestionnaireItemType.boolean]: true,
  [QuestionnaireItemType.group]: {},
  [QuestionnaireItemType.reference]: null,
};

export const FORM_TYPE_VALUES = {
  [QuestionnaireItemType.string]: "valueString",
  [QuestionnaireItemType.date]: "valueDate",
  [QuestionnaireItemType.choice]: "valueString",
  [QuestionnaireItemType.openChoice]: "valueOpenChoice",
  [QuestionnaireItemType.boolean]: "valueBoolean",
  [QuestionnaireItemType.reference]: "valueReference",
};

const FORMS_ICONS: Record<string, ReactElement> = {
  calendar: <IconCalendar size={20} />,
  search: <IconSearch size={20} />,
};

export const FORMS_FIELDS: Partial<FormFieldType> = {
  [QuestionnaireItemType.string]: <T,>({
    key,
    form,
    formFieldName,
    name,
    label,
    required,
    placeholder,
    icon,
    mask,
    enableWhen,
  }: FormComponentProps<T>) => (
    <EnableWhenWrapper key={key} enableWhen={enableWhen} form={form}>
      <MaskInput
        label={label}
        error={form.errors[formFieldName]}
        name={name}
        withAsterisk={required}
        placeholder={placeholder}
        mask={mask || ""}
        leftSection={typeof icon === "string" ? FORMS_ICONS[icon] : null}
        {...form.getInputProps(formFieldName)}
      />
    </EnableWhenWrapper>
  ),
  [QuestionnaireItemType.date]: <T,>({
    key,
    form,
    formFieldName,
    name,
    label,
    required,
    placeholder,
    icon,
    enableWhen,
  }: FormComponentProps<T>) => (
    <EnableWhenWrapper key={key} enableWhen={enableWhen} form={form}>
      <DateInput
        key={key}
        error={form.errors[formFieldName]}
        withAsterisk={required}
        valueFormat="MM/DD/YYYY"
        leftSection={typeof icon === "string" ? FORMS_ICONS[icon] : null}
        placeholder={placeholder}
        name={name}
        label={label}
        {...form.getInputProps(formFieldName)}
      />
    </EnableWhenWrapper>
  ),
  [QuestionnaireItemType.choice]: <T,>({
    key,
    form,
    formFieldName,
    name,
    label,
    questionnaireItem,
    questionnaireResponseItem,
    enableWhen,
  }: FormComponentProps<T>) => (
    <EnableWhenWrapper key={key} enableWhen={enableWhen} form={form}>
      <QuestionnaireChoiceField
        response={questionnaireResponseItem}
        label={label}
        key={key}
        form={form}
        name={name}
        onChangeAnswer={(value) => form.getInputProps(formFieldName).onChange(() => value)}
        questionnaireItem={questionnaireItem!}
        {...form.getInputProps(formFieldName)}
      />
    </EnableWhenWrapper>
  ),
  [QuestionnaireItemType.boolean]: <T,>({
    name,
    label,
    key,
    formFieldName,
    form,
    enableWhen,
  }: FormComponentProps<T>) => {
    return (
      <EnableWhenWrapper key={key} enableWhen={enableWhen} form={form}>
        <Checkbox
          key={key}
          id={name}
          name={name}
          label={label}
          value={form.getInputProps(formFieldName).value}
          style={{ marginBottom: 15, marginTop: 15 }}
          {...form.getInputProps(formFieldName)}
        />
      </EnableWhenWrapper>
    );
  },
  [QuestionnaireItemType.group]: <T,>({
    form,
    group,
    questionnaireResponseItem,
    label,
    key,
    name,
    enableWhen,
  }: FormComponentProps<T>) => (
    <EnableWhenWrapper key={key} enableWhen={enableWhen} form={form}>
      <QuestionnaireGroupField
        key={key}
        form={form}
        group={group}
        questionnaireResponse={questionnaireResponseItem}
        label={label}
        groupLinkId={name}
      />
    </EnableWhenWrapper>
  ),
  [QuestionnaireItemType.reference]: <T,>({
    form,
    formFieldName,
    key,
    name,
    label,
    placeholder,
    enableWhen,
  }: FormComponentProps<T>) => (
    <EnableWhenWrapper key={key} enableWhen={enableWhen} form={form}>
      <Stack gap={3} key={key}>
        <Text fw={500} size="sm">
          {label}
        </Text>
        <ResourceInput
          placeholder={placeholder}
          defaultValue={form.getInputProps(formFieldName).value}
          label={label}
          resourceType="Organization"
          searchCriteria={{ type: "ins" }}
          name={name}
          {...form.getInputProps(formFieldName)}
          onChange={(value) =>
            form.getInputProps(formFieldName).onChange(() => createReference(value!))
          }
        />
      </Stack>
    </EnableWhenWrapper>
  ),
} as const;

export const VALUE_TYPE_PARSERS: Record<
  string,
  (value: string | CodeableConcept | Reference<Resource>) => unknown
> = {
  valueString: (value) => value,
  valueDate: (value) => (typeof value === "string" ? parseISO(value) : value),
  valueBoolean: (value) => value,
  valueCoding: (value) => ({ valueCoding: value }),
  valueReference: (value) => value,
};
