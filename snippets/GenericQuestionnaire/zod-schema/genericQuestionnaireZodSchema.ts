import { isEmpty } from "@medplum/core";
import { QuestionnaireItem } from "@medplum/fhirtypes";
import { QuestionnaireItemType } from "@medplum/react";
import { formatISO } from "date-fns";

import { z, ZodType } from "zod";

export const REQUIRED_FIELD_MESSAGE = "This field is required";

const zodValidationOptions = (
  type: QuestionnaireItemType,
  isRequired = false,
  nestedItems?: QuestionnaireItem[],
): ZodType<unknown> => {
  if (type === QuestionnaireItemType.group && !isEmpty(nestedItems)) {
    const nestedSchemaObject = nestedItems!.reduce(
      (prev, cur) => {
        return {
          ...prev,
          [cur.linkId]: zodValidationOptions(
            cur.type as QuestionnaireItemType,
            !!cur.required,
            cur.item,
          ),
        };
      },
      {} as Record<string, ZodType<unknown>>,
    );

    return z.object(nestedSchemaObject);
  }

  if (type === QuestionnaireItemType.string) {
    return isRequired ? zStringReq() : z.string();
  }
  if (type === QuestionnaireItemType.date) {
    return isRequired
      ? z.date({ message: "This field is required" }).transform(zTransformISODate)
      : z.date().transform(zTransformISODate).nullish();
  }

  return z.any();
};

export const zodFormSchema = (questionnaireItems: QuestionnaireItem[]) => {
  const schemaObject: Record<string, ZodType<unknown>> = questionnaireItems.reduce(
    (prev, cur) => {
      return {
        ...prev,
        [cur.linkId]: zodValidationOptions(
          cur.type as QuestionnaireItemType,
          !!cur.required,
          cur.item,
        ),
      };
    },
    {} as Record<string, ZodType<unknown>>,
  );

  return z.object(schemaObject);
};

export function zTransformISODate(date: Date | null | undefined) {
    if (!date) return "";
    return formatISO(date, { representation: "date" });
  }
  
export function zStringReq(msg?: string, description?: string) {
return z
    .string({ description })
    .trim()
    .min(1, { message: msg ?? REQUIRED_FIELD_MESSAGE });
}