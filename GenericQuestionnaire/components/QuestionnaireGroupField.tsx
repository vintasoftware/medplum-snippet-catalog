import React from 'react'

import { QuestionnaireItem, QuestionnaireResponseItem } from "@medplum/fhirtypes";

import { Title } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import QuestionnaireForm from "./QuestionnaireForm";



const QuestionnaireGroupField = <T,>({
  form,
  group,
  questionnaireResponse,
  label,
  groupLinkId,
}: {
  group: QuestionnaireItem | undefined;
  form: UseFormReturnType<T>;
  questionnaireResponse?: QuestionnaireResponseItem;
  label?: string;
  groupLinkId: string;
}) => {
  const findNestedGroup = (
    items: QuestionnaireItem[] | undefined,
    linkId: string,
  ): QuestionnaireItem | undefined => {
    if (!items) return undefined;

    for (const item of items) {
      if (item.linkId === linkId) return item;
      if (item.item) {
        const nested = findNestedGroup(item.item, linkId);
        if (nested) return nested;
      }
    }
    return undefined;
  };

  const nestedGroup = findNestedGroup(group?.item, groupLinkId);

  return (
    <>
      {label && <Title order={5}>{label}</Title>}
      <QuestionnaireForm
        form={form}
        group={nestedGroup}
        questionnaireResponse={questionnaireResponse}
        parentPath={groupLinkId}
      />
    </>
  );
};

export default QuestionnaireGroupField;
