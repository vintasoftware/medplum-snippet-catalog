import { getExtensionValue } from "@medplum/core";
import { QuestionnaireItem, QuestionnaireResponseItem } from "@medplum/fhirtypes";

import { UseFormReturnType } from "@mantine/form";
import { FORMS_FIELDS } from "../constants";

const QuestionnaireForm = <T,>({
  group,
  form,
  questionnaireResponse,
  parentPath = "",
}: {
  group: QuestionnaireItem | undefined;
  form: UseFormReturnType<T>;
  questionnaireResponse?: QuestionnaireResponseItem;
  parentPath?: string;
}) => {
  //TODO: Change the null return to an better option (message, component, etc...)
  if (!group) return null;

  return group.item?.map((question) => {
    const component = FORMS_FIELDS[question.type];

    if (!component) return null;

    const formFieldName = parentPath ? `${parentPath}.${question.linkId}` : question.linkId;

    return component({
      group,
      key: question.linkId,
      form,
      formFieldName,
      label: question.text || "",
      name: question.linkId,
      required: question.required,
      questionnaireItem: question,
      questionnaireResponseItem: questionnaireResponse?.item?.find(
        (response) => response.linkId === question.linkId,
      ),
      enableWhen: question?.enableWhen?.[0],
      // HINT: Its needed to create a extension for each item below
      placeholder:
        (getExtensionValue(question, "create-your-own-extension-for-placeholder") as string) ?? "",
      icon: (getExtensionValue(question, "create-your-own-extension-for-icon") as string) ?? "",
      mask: (getExtensionValue(question, "create-your-own-extension-for-masl") as string) ?? "",
    });
  });
};

export default QuestionnaireForm;
