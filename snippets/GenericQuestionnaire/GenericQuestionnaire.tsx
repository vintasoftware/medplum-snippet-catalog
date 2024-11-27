import React, { useEffect, useState } from "react";

import { createReference } from "@medplum/core";
import {
  Patient,
  Questionnaire,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
} from "@medplum/fhirtypes";
import { Container, useMedplum, useMedplumProfile } from "@medplum/react";

import { Box, Button, Flex, Group, rem, Title } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";

import { ZodObject, ZodRawShape } from "zod";

import QuestionnaireForm from "./components/QuestionnaireForm";
import QuestionnaireWizardCounter from "./components/QuestionnaireWizardCounter";
import { createFormInitialValue, getCurrentQuestionnaireGroupInfo } from "./utils";
import { zodFormSchema } from "./zod-schema/genericQuestionnaireZodSchema";
import { FormValues } from "./types/genericQuestionnaireTypes";
import { fetchQuestionnaire, fetchQuestionnaireResponse, saveQuestionnaireResponse } from "./services/questionnaireServices";

function IntakeForms() {
  const profile = useMedplumProfile() as Patient;
  const medplum = useMedplum();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();
  const [questionnaireResponse, setQuestionnaireResponse] = useState<QuestionnaireResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [formSchema, setFormSchema] = useState<ZodObject<ZodRawShape> | undefined>();
  const [indexFormNavigator, setIndexFormNavigator] = useState<number | undefined>();
  const { currentGroup, groupIndex, groupsCount } = getCurrentQuestionnaireGroupInfo(
    questionnaire,
    questionnaireResponse,
    indexFormNavigator,
  );

  const form = useForm<FormValues>({
    validate: formSchema ? zodResolver(formSchema) : undefined,
    initialValues: {},
  });

  const handleSubmit = async (formValues: FormValues) => {
    if (!currentGroup || !questionnaire?.id || !formSchema) return;

    const parsedValues = formSchema.parse(formValues);
    const questionnaireResponseResults = await saveQuestionnaireResponse(
      parsedValues,
      medplum,
      questionnaire,
      createReference(profile),
      questionnaireResponse,
    );

    setQuestionnaireResponse(questionnaireResponseResults);
    setIndexFormNavigator((prev) => {
      if (prev !== undefined && prev + 1 !== groupsCount) {
        return prev + 1;
      }
      return prev;
    });
  };

  const formSetValues = form.setValues;

  useEffect(() => {
    const getQuestionnaire = async () => {
      const results = await fetchQuestionnaire(medplum);
      setQuestionnaire(results);

      if (results && results.item?.length) {
        const userResponse = await fetchQuestionnaireResponse(
          medplum,
          results.id || "",
          createReference(profile),
        );
        setQuestionnaireResponse(userResponse);
      }

      setIsLoading(false);
    };

    getQuestionnaire();
  }, [medplum, profile]);

  const onPreviousClick = () => {
    if (indexFormNavigator === 0) return;
    setIndexFormNavigator((prev) => {
      if (prev !== undefined) return prev - 1;
      return 0;
    });
  };

  useEffect(() => {
    if (questionnaireResponse) {
      setIndexFormNavigator(groupIndex ?? undefined);
    }
  }, [groupIndex, questionnaireResponse]);

  useEffect(() => {
    let currentGroupResponses: QuestionnaireResponseItem[] = [];

    if (questionnaireResponse?.item && groupIndex !== undefined) {
      currentGroupResponses = questionnaireResponse?.item[groupIndex]?.item || [];
    }

    const schema = zodFormSchema(currentGroup?.item || []);
    setFormSchema(schema);

    formSetValues(createFormInitialValue(currentGroup?.item || [], currentGroupResponses));
  }, [currentGroup?.item, formSetValues, groupIndex, questionnaireResponse?.item]);

  return (
    <React.Fragment>
      {isLoading ? (
        // Add your own loading component
        <span>Loading...</span>
      ) : (
        <Container p="md">
          <Group mb="xl" justify="space-between">
            <Title order={3}>{currentGroup?.text}</Title>
            <QuestionnaireWizardCounter
              current={groupIndex !== undefined ? groupIndex + 1 : groupIndex}
              total={groupsCount}
            />
          </Group>
          <form onSubmit={form.onSubmit((intakeFormValues, _) => handleSubmit(intakeFormValues))}>
            <Box>
              <Flex direction="column" gap="lg">
                <QuestionnaireForm
                  questionnaireResponse={questionnaireResponse?.item?.[groupIndex || 0]}
                  group={currentGroup}
                  form={form}
                />
              </Flex>
              <Group mt={rem(68)} justify="flex-end">
                <Button onClick={onPreviousClick} variant="outline" color="burgundy.9">
                  Previous
                </Button>
                <Button type="submit">Continue</Button>
              </Group>
            </Box>
          </form>
        </Container>
      )}
    </React.Fragment>
  );
}

export default IntakeForms;
