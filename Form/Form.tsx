import { ActionIcon, Box, Button, Grid, Group, Stack, Text } from '@mantine/core';
import { Form as MedplumForm } from '@medplum/react';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { FormChildrenProps, FormInputOnChange } from './types';
import { CodingInput, DateTimeInput, ResourceInput, TextArea, TimeInput } from './FormFields';

interface NestedFieldProps {
  children: (props: FormChildrenProps) => React.ReactNode;
  onChange: FormInputOnChange;
  path: string;
  label: string;
  repeats?: boolean;
  defaultData?: object | object[];
}

function NestedField(props: NestedFieldProps): JSX.Element {
  const { path, label, repeats, children, onChange, defaultData = [] } = props;

  function getDefaultData(): object[] {
    return Array.isArray(defaultData) ? defaultData : [defaultData];
  }
  const [formData, setFormData] = useState<object[]>(getDefaultData());
  const [errorList, setErrorList] = useState<object[]>(Array(getDefaultData().length).fill({}));

  function getError(errors: object[]): string | undefined {
    for (const error of errors) {
      const errorMessage = Object.values(error).find((v) => v !== undefined);
      if (errorMessage) {
        return errorMessage;
      }
    }
    return undefined;
  }

  const handleChildChange = (index: number, childPath: string, data: object, error?: string) => {
    const changedData = { ...formData[index], [childPath]: data };
    const newData = [...formData];
    newData[index] = changedData;
    setFormData(newData);

    const newError = { ...errorList[index], [childPath]: error };
    const newErrorList = [...errorList];
    newErrorList[index] = newError;
    setErrorList(newErrorList);

    onChange(path, newData, getError(newErrorList));
  };

  function addItem() {
    const newData = [...formData, {}];
    setFormData(newData);

    const newErrorList = [...errorList, {}];
    setErrorList(newErrorList);

    onChange(path, newData, getError(newErrorList));
  }

  function removeItem(index: number) {
    const newData = [...formData];
    newData.splice(index, 1);
    setFormData(newData);

    const newErrorList = [...errorList];
    newErrorList.splice(index, 1);
    setErrorList(newErrorList);

    onChange(path, newData, getError(newErrorList));
  }

  return (
    <Box>
      <Text fw="bold">{label}</Text>
      {formData.map((d, index) => {
        return (
          <Grid key={`${path}-${index}`}>
            <Grid.Col span={11}>
              <Box mt="xs">
                <Stack pl="sm" style={{ borderLeft: '2px solid' }} pt="xs" pb="xs">
                  {children({
                    defaultData: d,
                    onChange: (path, data, error) => handleChildChange(index, path, data, error),
                  })}
                </Stack>
              </Box>
            </Grid.Col>
            <Grid.Col span={1}>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => removeItem(index)}
                mt="xs"
                style={{ height: '100%' }}
              >
                <IconTrash />
              </ActionIcon>
            </Grid.Col>
          </Grid>
        );
      })}
      <Box mt="md">{repeats && <Button onClick={addItem}>Add {label}</Button>}</Box>
    </Box>
  );
}

interface FormProps {
  children: (props: FormChildrenProps) => React.ReactNode;
  onSubmit?: (formData: Record<string, any>, error?: string) => void;
  defaultData?: Record<string, any>;
}

export function Form(props: FormProps): JSX.Element {
  const { children, defaultData, onSubmit } = props;
  const [formData, setFormData] = useState<any>(defaultData);
  const [errorMap, setErrorMap] = useState<object>({});

  function handleChange(path: string, data: any, error?: string) {
    setErrorMap((prev) => ({ ...prev, [path]: error }));
    setFormData((prev: any) => ({ ...prev, [path]: data }));
  }

  function handleSubmit(): void {
    const errorMessage = Object.values(errorMap).find((v) => v !== undefined);
    onSubmit?.(formData, errorMessage);
  }

  return (
    <MedplumForm onSubmit={handleSubmit}>
      <Stack>{children({ onChange: handleChange, defaultData: formData })}</Stack>
      <Group justify="flex-end" mt="xl" gap="xs">
        <Button type="submit">Submit</Button>
      </Group>
    </MedplumForm>
  );
}

Form.NestedField = NestedField;
Form.ResourceInput = ResourceInput;
Form.CodingInput = CodingInput;
Form.DateTimeInput = DateTimeInput;
Form.TimeInput = TimeInput;
Form.TextArea = TextArea;
