import { MedplumClient } from "@medplum/core";
import { Patient, Questionnaire, QuestionnaireResponse, Reference } from "@medplum/fhirtypes";
import { FormValues } from "../types/genericQuestionnaireTypes";
import { getQuestionnaireResponseFromFormValues } from "../utils";

export const saveQuestionnaireResponse = async (
  values: FormValues,
  medplum: MedplumClient,
  questionnaire: Questionnaire,
  patientReference: Reference<Patient>,
  questionnaireResponse?: QuestionnaireResponse,
) => {
  const questionnaireResponseData = getQuestionnaireResponseFromFormValues(
    questionnaire,
    values,
    patientReference,
    patientReference,
    questionnaireResponse,
  ) as QuestionnaireResponse;

  if (questionnaireResponse && questionnaireResponse.id) {
    const updatedQuestionnaireResponse = await medplum.updateResource({
      ...questionnaireResponseData,
      id: questionnaireResponse.id,
    });

    return updatedQuestionnaireResponse;
  }

  const questionnaireResponseResults = await medplum.createResource(questionnaireResponseData);
  return questionnaireResponseResults;
};

export const fetchQuestionnaire = async (medplum: MedplumClient) => {
  //HINT: Add your own questionnaire url
  const questionnaire = await medplum.searchResources("Questionnaire", {
    url: "add-questionnaire-url",
  });

  return questionnaire[0];
};

export const fetchQuestionnaireResponse = async (
  medplum: MedplumClient,
  questionnaireId: string,
  subject: Reference<Patient>,
) => {
  const questionnaireResponse = await medplum.searchResources("QuestionnaireResponse", {
    subject: subject.reference,
    questionnaire:`Questionnaire/${questionnaireId}`,
  });

  return questionnaireResponse[0];
};
