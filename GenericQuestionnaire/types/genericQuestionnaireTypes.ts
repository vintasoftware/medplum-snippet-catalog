import { ReactNode } from "react";

import {
  QuestionnaireItem,
  QuestionnaireItemEnableWhen,
  QuestionnaireResponseItem,
} from "@medplum/fhirtypes";
import { QuestionnaireItemType } from "@medplum/react";

import { UseFormReturnType } from "@mantine/form";

import { z } from "zod";

import { zodFormSchema } from "../zod-schema/genericQuestionnaireZodSchema";

export type FormValues = z.infer<ReturnType<typeof zodFormSchema>>;

export type FormFieldType = Record<
  QuestionnaireItemType,
  <T>(props: FormComponentProps<T>) => ReactNode
>;

export type FormInitialValuesType = Record<
  QuestionnaireItemType,
  string | null | object | boolean
>;

export type FormComponentProps<T> = {
  key: string;
  form: UseFormReturnType<T>;
  formFieldName: string;
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  icon?: string;
  mask?: string;
  enableWhen?: QuestionnaireItemEnableWhen;
  questionnaireItem?: QuestionnaireItem;
  questionnaireResponseItem?: QuestionnaireResponseItem;
  group?: QuestionnaireItem;
};
