import dayjs from 'dayjs';
import { Box, Grid, Paper, Text, Title } from '@mantine/core';
import { Appointment, Patient, Practitioner, Reference } from '@medplum/fhirtypes';
import { IconClock, IconStethoscope } from '@tabler/icons-react';
import { getAppointmentPatient, getAppointmentPractitioner } from './appointment';

interface AppointmentItemProps {
  appointment: Appointment;
}

export function AppointmentItem(props: AppointmentItemProps): JSX.Element {
  const { appointment } = props;

  const patient = getAppointmentPatient(appointment) as Reference<Patient> | undefined;
  const practitioner = getAppointmentPractitioner(appointment) as Reference<Practitioner> | undefined;

  return (
    <Paper mb="xs" mt="xs" p="xs" withBorder>
      <Grid>
        <Grid.Col span={2}>
          <Title order={3}>{dayjs(appointment.start).format('DD')}</Title>
          <Text>{dayjs(appointment.start).format('MMM')}</Text>
        </Grid.Col>
        <Grid.Col span={10} pl="xs">
          <Title order={4}>{patient?.display}</Title>
          <Box display="flex">
            <IconStethoscope size={16} />
            <Text truncate flex={1} pl="xs">
              {practitioner?.display}
            </Text>
          </Box>
          <Box display="flex">
            <IconClock size={16} display="inline-block" />
            <Text display="inline-block" ml="xs">
              {dayjs(appointment.start).format('h:mma')} - {dayjs(appointment.end).format('h:mma')}
            </Text>
          </Box>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
