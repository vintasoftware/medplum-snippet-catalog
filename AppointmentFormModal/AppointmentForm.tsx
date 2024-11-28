import dayjs from 'dayjs';
import { Box, Text } from '@mantine/core';
import { Appointment, Patient, Practitioner } from '@medplum/fhirtypes';
import { createReference, formatHumanName } from '@medplum/core';
import { Form, ResourceForm } from '../Form';

export function formatTimeInput(baseDate: Date, timeInput: string) {
  const [hour, minute] = timeInput.split(':');
  return dayjs(baseDate).set('hour', parseInt(hour)).set('minute', parseInt(minute)).set('second', 0).toISOString();
}

interface AppointmentFormProps {
  editAppointment?: Appointment;
  patient?: Patient;
  selectedPractitioner?: Practitioner;
  selectedDate: Date;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function AppointmentForm(props: AppointmentFormProps): JSX.Element {
  const { editAppointment, patient, selectedPractitioner, selectedDate, disabled = false, onSuccess } = props;

  function appointmentToFormData(appointment: Appointment): Record<string, any> {
    const patient = appointment.participant.find((p) => p?.actor?.resource?.resourceType === 'Patient')?.actor
      ?.resource as Patient | undefined;

    return {
      patient,
      serviceType: appointment.serviceType?.[0].coding?.[0],
      startTime: dayjs(appointment.start).format('HH:mm'),
      endTime: dayjs(appointment.end).format('HH:mm'),
    };
  }

  function formDataToAppointment(formData: Record<string, any>): Record<string, any> {
    return {
      ...formData,
      resourceType: 'Appointment',
      status: 'booked',
      startTime: undefined,
      endTime: undefined,
      patient: undefined,
      start: formatTimeInput(selectedDate, formData.startTime),
      end: formatTimeInput(selectedDate, formData.endTime),
      participant: [
        {
          actor: createReference(selectedPractitioner as Practitioner),
          status: 'accepted',
        },
        {
          actor: createReference(patient ?? formData.patient),
          status: 'accepted',
        },
      ],
    };
  }

  return (
    <>
      {selectedDate && (
        <Box pb="xs">
          <Text display="inline-block" fw="bold">
            Date:
          </Text>
          <Text display="inline-block" pl="xs">
            {dayjs(selectedDate).format('MMM DD, YYYY')}
          </Text>
        </Box>
      )}
      <Box pb="xs">
        <Text display="inline-block" fw="bold">
          Practitioner:
        </Text>
        <Text display="inline-block" pl="xs">
          {selectedPractitioner?.name && formatHumanName(selectedPractitioner.name[0])}
        </Text>
      </Box>
      {patient && (
        <Box pb="xs">
          <Text display="inline-block" fw="bold">
            Patient:
          </Text>
          <Text display="inline-block" pl="xs">
            {patient.name?.[0] && formatHumanName(patient.name?.[0])}
          </Text>
        </Box>
      )}

      <ResourceForm
        resourceToFormData={appointmentToFormData}
        formDataToResource={formDataToAppointment}
        defaultData={editAppointment}
        onSuccess={onSuccess}
      >
        {({ onChange, defaultData }) => (
          <>
            {!patient && (
              <Form.ResourceInput
                resourceType="Patient"
                label="Select patient"
                name="patient"
                onChange={onChange}
                defaultValue={patient ?? defaultData?.patient}
                disabled={disabled}
                required
              />
            )}
            <Form.CodingInput
              label="Service Type"
              name="serviceType"
              path="serviceType"
              binding="http://hl7.org/fhir/ValueSet/service-type"
              onChange={onChange}
              defaultValue={defaultData?.serviceType}
              disabled={disabled}
              required
            />
            <Form.TimeInput
              label="Starts at"
              name="startTime"
              onChange={onChange}
              defaultValue={defaultData?.startTime}
              disabled={disabled}
              required
            />
            <Form.TimeInput
              label="Ends at"
              name="endTime"
              onChange={onChange}
              defaultValue={defaultData?.endTime}
              disabled={disabled}
              required
            />
          </>
        )}
      </ResourceForm>
    </>
  );
}
