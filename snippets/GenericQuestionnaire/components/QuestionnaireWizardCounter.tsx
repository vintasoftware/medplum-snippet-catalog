import React from "react";

import { MantineStyleProp, Text, TextProps } from "@mantine/core";

const MINIMUM_GROUP_SIZE = 2;

interface TextWrapperProps extends TextProps {
  variant?: keyof typeof textVariants;
  style?: MantineStyleProp;
  children: React.ReactNode;
}

const textVariants = {
  primary: { base: 500, md: 400, lg: 500 },
  bold: { base: 700, md: 600, lg: 700 },
} as const;

interface QuestionnaireWizardCounterProps {
  total: number | undefined;
  current: number | undefined;
}

function QuestionnaireWizardCounter({ total, current }: QuestionnaireWizardCounterProps) {
  if (!total || !current || total < MINIMUM_GROUP_SIZE) return null;

  return (
    <TextWrapper variant="bold" size="sm" c="gray.7">
      {current} of {total}
    </TextWrapper>
  );
};



function TextWrapper({ variant = "primary", style, children, ...mantineProps }: TextWrapperProps) {
  return (
    <Text
      size="sm"
      fw={textVariants[variant]}
      style={{ wordWrap: "break-word", ...style }}
      {...mantineProps}
    >
      {children}
    </Text>
  );
}


export default QuestionnaireWizardCounter;