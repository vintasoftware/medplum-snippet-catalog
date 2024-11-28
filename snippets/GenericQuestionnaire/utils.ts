import { getAllQuestionnaireAnswers, getExtensionValue } from "@medplum/core";
import {
  CodeableConcept,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
  Reference,
  Resource,
} from "@medplum/fhirtypes";
import { QuestionnaireItemType } from "@medplum/react";

import { formatISO } from "date-fns";
import pick from "lodash/pick";

import { FORM_INITIAL_VALUES, FORM_TYPE_VALUES, VALUE_TYPE_PARSERS } from "./constants";


const parseInitialData = (valueType: string, value: string) => {
  const parser = VALUE_TYPE_PARSERS[valueType] || (() => "");
  return value ? parser(value) : "";
};

export const createFormInitialValue = (
  questionnaireItems: QuestionnaireItem[],
  questionnaireResponseItems: QuestionnaireResponseItem[] = [],
): Record<string, unknown> => {
  const getResponseItem = (
    linkId: string,
    items: QuestionnaireResponseItem[],
  ): QuestionnaireResponseItem | undefined => {
    for (const item of items) {
      if (item.linkId === linkId) return item;
      const nestedResponseItem = item.item ? getResponseItem(linkId, item.item) : undefined;
      if (nestedResponseItem) return nestedResponseItem;
    }
    return undefined;
  };

  return questionnaireItems.reduce((acc, item) => {
    const responseItem = getResponseItem(item.linkId, questionnaireResponseItems);

    if (item.type === "group" && item.item) {
      return {
        ...acc,
        [item.linkId]: createFormInitialValue(item.item, responseItem?.item ?? []),
      };
    }

    const answers = responseItem?.answer?.map((answer) => {
      const [valueType, value] = Object.entries(answer)[0];
      return parseInitialData(valueType, value);
    });

    const initialValue =
      answers && answers.length > 1
        ? answers
        : (answers?.[0] ?? FORM_INITIAL_VALUES[item.type] ?? null);

    return { ...acc, [item.linkId]: initialValue };
  }, {});
};

export const getCorrectAnswerTypeValue = (
  questionName: string,
  questions: QuestionnaireItem[],
): string => {
  const currentQuestion = questions.find((question) => question.linkId === questionName);

  if (!currentQuestion) return FORM_TYPE_VALUES[QuestionnaireItemType.string];

  return FORM_TYPE_VALUES[currentQuestion.type as keyof typeof FORM_TYPE_VALUES];
};

//TODO: Some values are hardcoded, but they will be changed when retrieving the QuestionnaireResponse for the specific form
export const getCurrentQuestionnaireGroupInfo = (
  questionnaire: Questionnaire | undefined,
  questionnaireResponse: QuestionnaireResponse | undefined,
  indexFormNavigator?: number,
) => {
  const flattenGroups = (items: QuestionnaireItem[]): QuestionnaireItem[] => {
    return items.flatMap((item) =>
      item.type === QuestionnaireItemType.group ? flattenGroups(item.item ?? []) : item,
    );
  };

  const allItemIsGroup = questionnaire?.item?.every(
    (question) => question.type === QuestionnaireItemType.group,
  );

  if (!allItemIsGroup || !questionnaire) return {};

  if (!questionnaireResponse)
    return {
      currentGroup: questionnaire.item?.[0],
      groupsCount: questionnaire.item?.length,
      groupIndex: 0,
    };

  if (indexFormNavigator !== undefined) {
    return {
      currentGroup: questionnaire.item?.[indexFormNavigator],
      groupsCount: questionnaire.item?.length,
      groupIndex: indexFormNavigator,
    };
  }

  const answers = getAllQuestionnaireAnswers(questionnaireResponse);

  const areAllRequiredQuestionsAnswered = (group: QuestionnaireItem): boolean => {
    const groupQuestions = flattenGroups(group.item ?? []);
    const requiredQuestions = groupQuestions.filter((question) => question.required);

    return requiredQuestions.every((question) => answers[question.linkId]);
  };

  const hasAnyQuestionAnswered = (group: QuestionnaireItem): boolean => {
    const groupQuestions = flattenGroups(group.item ?? []);
    return groupQuestions.some((question) => answers[question.linkId]);
  };

  const findNextGroupIndex =
    questionnaire.item?.findIndex((group) => {
      const hasRequiredQuestions = flattenGroups(group.item ?? []).some(
        (question) => question.required,
      );

      if (hasRequiredQuestions) {
        return !areAllRequiredQuestionsAnswered(group);
      }

      return !hasAnyQuestionAnswered(group);
    }) ?? -1;

  const indexToUse =
    findNextGroupIndex === -1 ? (questionnaire.item?.length ?? 1) - 1 : findNextGroupIndex;

  return {
    currentGroup: questionnaire.item?.[indexToUse],
    groupsCount: questionnaire.item?.length ?? 0,
    groupIndex: indexToUse,
  };
};

const QUESTIONNAIRE_RESPONSE_ITEM_FIELDS = [
  "id",
  "linkId",
  "extension",
  "modifierExtension",
  "definition",
  "text",
] as const;

export function getQuestionnaireResponseFromFormValues(
  questionnaire: Questionnaire,
  values: Record<string, unknown>,
  subject: Reference<Patient>,
  source: Reference<Patient | Practitioner>,
  questionnaireResponse: QuestionnaireResponse | null = null,
) {
  return {
    resourceType: "QuestionnaireResponse",
    questionnaire: `Questionnaire/${questionnaire.id!})`,
    status: "in-progress",
    authored: formatISO(new Date()),
    subject,
    source,
    item: mapQuestionnaireItems(questionnaire.item, values, questionnaireResponse?.item),
  };
}

function mapQuestionnaireItems(
  items: QuestionnaireItem[] | undefined,
  values: Record<string, unknown>,
  previousQuestionnaireResponseItems: QuestionnaireResponseItem[] | undefined,
): QuestionnaireResponseItem[] {
  const result: QuestionnaireResponseItem[] = [];
  if (!items) return result;

  for (const questionnaireItem of items) {
    const questionnaireResponseItem = pick(
      questionnaireItem,
      QUESTIONNAIRE_RESPONSE_ITEM_FIELDS,
    ) as QuestionnaireResponseItem;

    const previousQuestionnaireResponseItem = previousQuestionnaireResponseItems?.find(
      (item) => item.linkId === questionnaireItem.linkId,
    );

    if (questionnaireItem.type === "group") {
      const nestedValues = values[questionnaireItem.linkId] as Record<string, unknown>;

      result.push({
        ...questionnaireResponseItem,
        item: mapQuestionnaireItems(
          questionnaireItem.item!,
          nestedValues || values,
          previousQuestionnaireResponseItem?.item,
        ),
      });
      continue;
    }

    const value = values[questionnaireItem.linkId];
    if (!value && previousQuestionnaireResponseItem?.answer) {
      questionnaireResponseItem.answer = previousQuestionnaireResponseItem.answer;
      result.push(questionnaireResponseItem);
      continue;
    }

    if (!value) continue;

    if (questionnaireItem.answerValueSet) {
      questionnaireResponseItem.answer = [value];
      result.push(questionnaireResponseItem);
      continue;
    }

    const formControlCodeableConcept = getExtensionValue(
      questionnaireItem,
      "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
    ) as CodeableConcept | undefined;
    const formControlType = formControlCodeableConcept?.coding?.[0]?.code;

    if (formControlType) {
      questionnaireResponseItem.answer = handleFormControlAnswer(formControlType, value);
    } else {
      questionnaireResponseItem.answer = handleBaseTypeAnswer(questionnaireItem.type, value);
    }

    result.push(questionnaireResponseItem);
  }

  return result;
}

function handleFormControlAnswer(
  formControlType: string,
  value: unknown,
): QuestionnaireResponseItemAnswer[] {
  switch (formControlType) {
    case "radio-button":
      return [{ valueString: value as string }];
    case "check-box":
      return (value as string[])?.map((answerValue) => ({ valueString: answerValue }));
    default:
      return [];
  }
}

function handleBaseTypeAnswer(itemType: string, value: unknown): QuestionnaireResponseItemAnswer[] {
  switch (itemType) {
    case "string":
    case "choice":
      return [{ valueString: value as string }];
    case "date":
      return [{ valueDate: value as string }];
    case "reference":
      return [{ valueReference: value as Reference<Resource> }];
    default:
      return [];
  }
}

export function getNestedFormAnswer(intakeForm: Record<string, unknown>, key: string): unknown {
  if (key in intakeForm) {
    return intakeForm[key];
  }

  for (const linkId in intakeForm) {
    if (typeof intakeForm[linkId] === "object" && intakeForm[linkId] !== null) {
      const result = getNestedFormAnswer(intakeForm[linkId] as Record<string, unknown>, key);
      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
}
