import { createReference } from '@medplum/core';
import {
  CodingInput as MedplumCodingInput,
  CodingInputProps as MedplumCodingInputProps,
  ResourceInput as MedplumResourceInput,
  ResourceInputProps as MedplumResourceInputProps,
  DateTimeInput as MedplumDateTimeInput,
  DateTimeInputProps as MedplumDateTimeInputProps,
} from '@medplum/react';
import { FormInputOnChange } from './types';
import { useEffect } from 'react';
import { Textarea as MantineTextarea, TextareaProps as MantineTextareaProps } from '@mantine/core';
import { TimeInput as MantineTimeInput, TimeInputProps as MantineTimeInputProps } from '@mantine/dates';

interface TextAreaProps extends Omit<MantineTextareaProps, 'onChange' | 'name'> {
  name: string;
  onChange: FormInputOnChange;
}

export function TextArea(props: TextAreaProps): JSX.Element {
  const { name, onChange, defaultValue, required } = props;

  useEffect(() => {
    handleChange(defaultValue);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(value: any) {
    if (!value) {
      let error = undefined;
      if (required) {
        error = 'Missing required field';
      }
      onChange(name, undefined, error);
    } else {
      onChange(name, value);
    }
  }

  return <MantineTextarea {...props} onChange={(e) => handleChange(e?.target?.value)} />;
}

interface DateTimeInputProps extends Omit<MedplumDateTimeInputProps, 'onChange' | 'name'> {
  name: string;
  onChange: FormInputOnChange;
}

export function DateTimeInput(props: DateTimeInputProps): JSX.Element {
  const { name, onChange, defaultValue, required } = props;

  useEffect(() => {
    handleChange(defaultValue);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(value: any) {
    if (!value) {
      let error = undefined;
      if (required) {
        error = 'Missing required field';
      }
      onChange(name, undefined, error);
    } else {
      onChange(name, value);
    }
  }
  return <MedplumDateTimeInput {...props} onChange={handleChange} />;
}

interface TimeInputProps extends Omit<MantineTimeInputProps, 'onChange' | 'name'> {
  name: string;
  onChange: FormInputOnChange;
}

export function TimeInput(props: TimeInputProps): JSX.Element {
  const { name, onChange, defaultValue, required } = props;

  useEffect(() => {
    handleChange(defaultValue);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(value: any) {
    if (!value) {
      let error = undefined;
      if (required) {
        error = 'Missing required field';
      }
      onChange(name, undefined, error);
    } else {
      onChange(name, value);
    }
  }
  return <MantineTimeInput {...props} onChange={(e) => handleChange(e?.target?.value)} />;
}

interface ResourceInputProps extends Omit<MedplumResourceInputProps, 'onChange'> {
  onChange: FormInputOnChange;
}

export function ResourceInput(props: ResourceInputProps): JSX.Element {
  const { name, onChange, required, defaultValue } = props;

  useEffect(() => {
    handleChange(defaultValue);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(data: any) {
    if (!data) {
      let error = undefined;
      if (required) {
        error = 'Missing required field';
      }
      onChange(name, undefined, error);
    } else {
      onChange(name, createReference(data));
    }
  }
  return <MedplumResourceInput {...props} onChange={handleChange} />;
}

interface CodingInputProps extends Omit<MedplumCodingInputProps, 'onChange'> {
  onChange: FormInputOnChange;
}

export function CodingInput(props: CodingInputProps): JSX.Element {
  const { name, onChange, defaultValue, required } = props;

  useEffect(() => {
    handleChange(defaultValue);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(value: any) {
    if (!value) {
      let error = undefined;
      if (required) {
        error = 'Missing required field';
      }
      onChange(name, undefined, error);
    } else {
      onChange(name, [{ coding: [value] }]);
    }
  }
  return <MedplumCodingInput {...props} onChange={handleChange} />;
}
