import { parseReference } from '@medplum/core';
import { Appointment, Patient, Practitioner, Reference } from '@medplum/fhirtypes';

export function getAppointmentParticipant(
  appointment: Appointment,
  resourceType: string
): Reference<Patient | Practitioner> | undefined {
  return appointment.participant.find((p) => {
    if (!p?.actor) {
      return false;
    }
    const [participantType] = parseReference(p?.actor);
    return participantType === resourceType;
  })?.actor as Reference<Patient | Practitioner> | undefined;
}

export function getAppointmentPatient(appointment: Appointment): Reference<Patient> | undefined {
  return getAppointmentParticipant(appointment, 'Patient') as Reference<Patient> | undefined;
}

export function getAppointmentPractitioner(appointment: Appointment): Reference<Practitioner> | undefined {
  return getAppointmentParticipant(appointment, 'Practitioner') as Reference<Practitioner> | undefined;
}
