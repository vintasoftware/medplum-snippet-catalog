import React from 'react'

import { IMaskInput } from "react-imask";

import {
  __BaseInputProps,
  __InputStylesNames,
  BoxProps,
  ElementProps,
  Factory,
  factory,
  InputBase,
  StylesApiProps,
  useProps,
} from "@mantine/core";

export interface MaskInputProps
  extends BoxProps,
    __BaseInputProps,
    StylesApiProps<MaskInputFactory>,
    ElementProps<"input", "size"> {
  mask?: string;
}

export type MaskInputFactory = Factory<{
  props: MaskInputProps;
  ref: HTMLInputElement;
  stylesNames: __InputStylesNames;
}>;

const defaultProps: Partial<MaskInputProps> = {};

export const MaskInput = factory<MaskInputFactory>((props, ref) => {
  const { value, ..._props } = useProps("TextInput", defaultProps, props);

  return (
    <InputBase
      component={IMaskInput}
      ref={ref}
      {..._props}
      value={value?.toString()}
      __staticSelector="Input"
    />
  );
});

MaskInput.classes = InputBase.classes;

export default MaskInput;
