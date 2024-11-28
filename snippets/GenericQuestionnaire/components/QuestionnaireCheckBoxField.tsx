import React, { QuestionnaireItem } from "@medplum/fhirtypes";

import { Checkbox, Stack } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";

type QuestionnaireCheckboxField<T> = {
  label?: string;
  name: string;
  group: QuestionnaireItem | undefined;
  form: UseFormReturnType<T>;
};

const QuestionnaireCheckboxField = <T,>({
  group,
  form,
  label,
  name,
}: QuestionnaireCheckboxField<T>) => {
  const { checked, ...formInputProps } = form.getInputProps(name, { type: "checkbox" });

  return (
    <Checkbox.Group label={label} value={checked || []} {...formInputProps}>
      <Stack>
        {group?.answerOption?.map((item) => (
          <Checkbox key={item.valueString} value={item.valueString} label={item.valueString} />
        ))}
      </Stack>
    </Checkbox.Group>
  );
};

export default QuestionnaireCheckboxField;
