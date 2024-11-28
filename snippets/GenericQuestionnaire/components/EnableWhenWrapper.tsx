import { ReactNode } from "react";

import { QuestionnaireItemEnableWhen } from "@medplum/fhirtypes";

import { UseFormReturnType } from "@mantine/form";
import { getNestedFormAnswer } from "../utils";


enum EnableWhenPossibilities {
  "=" = "===",
  "!=" = "!==",
  ">" = ">",
  "<" = "<",
  ">=" = ">=",
  "<=" = "<=",
}

type EnableWhenWrapperProps<T> = {
  form: UseFormReturnType<T>;
  enableWhen: QuestionnaireItemEnableWhen | undefined;
  children: ReactNode;
};

function isEnableWhenPossibility(key: string): key is keyof typeof EnableWhenPossibilities {
  return key in EnableWhenPossibilities;
}

const EnableWhenWrapper = <T,>({ form, enableWhen, children }: EnableWhenWrapperProps<T>) => {
  if (!enableWhen) return children;

  const { operator, question, ...enableWhenRest } = enableWhen;

  if (!isEnableWhenPossibility(operator)) return children;

  const questionAnswer = getNestedFormAnswer(
    form.values as Record<string, unknown>,
    question,
  ) as string;

  if (!questionAnswer) return null;

  let conditionMet = false;
  switch (operator) {
    case "=":
      conditionMet = questionAnswer === enableWhenRest.answerString;
      break;
    case "!=":
      conditionMet = questionAnswer !== enableWhenRest.answerString;
      break;
    case ">":
      conditionMet = parseInt(questionAnswer) > enableWhenRest.answerInteger!;
      break;
    case "<":
      conditionMet = parseInt(questionAnswer) < enableWhenRest.answerInteger!;
      break;
    case ">=":
      conditionMet = parseInt(questionAnswer) >= enableWhenRest.answerInteger!;
      break;
    case "<=":
      conditionMet = parseInt(questionAnswer) <= enableWhenRest.answerInteger!;
      break;
    default:
      conditionMet = false;
  }

  return conditionMet ? children : null;
};

export default EnableWhenWrapper;
