import dayjs from 'dayjs';
import { Box, Grid, Group, Loader, Modal, Paper, ScrollArea, Title, Text } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { ResourceInput, useMedplum } from '@medplum/react';
import { useCallback, useEffect, useState } from 'react';
import { Appointment, Patient, Practitioner } from '@medplum/fhirtypes';
import { getReferenceString } from '@medplum/core';
import { AppointmentForm } from './AppointmentForm';
import { AppointmentItem } from './AppointmentItem';
import '@mantine/dates/styles.css';

interface AppointmentFormModalProps {
  opened: boolean;
  onClose: () => void;
  patient?: Patient;
  rescheduleAppointment?: Appointment;
}

export function AppointmentFormModal(props: AppointmentFormModalProps): JSX.Element {
  const { opened, onClose, patient, rescheduleAppointment } = props;
  const medplum = useMedplum();
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const fetchAppointments = useCallback(
    async (practitioner: Practitioner | undefined, date: Date) => {
      if (!(practitioner && date)) {
        setAppointments([]);
        return;
      }

      setAppointments([]);
      setIsLoadingAppointments(true);

      const start = dayjs(date).format('YYYY-MM-DD');
      const end = dayjs(date).add(1, 'day').format('YYYY-MM-DD');
      const appointments = await medplum.searchResources(
        'Appointment',
        `practitioner=${getReferenceString(practitioner)}&date=ge${start}&date=lt${end}`
      );

      setAppointments(appointments);
      setIsLoadingAppointments(false);
    },
    [medplum]
  );

  useEffect(() => {
    if (rescheduleAppointment) {
      const practitioner = rescheduleAppointment.participant.find(
        (p) => p?.actor?.resource?.resourceType === 'Practitioner'
      )?.actor?.resource as Practitioner | undefined;
      const date = new Date(rescheduleAppointment.start as string);

      if (practitioner) {
        setSelectedPractitioner(practitioner);
      }
      if (date) {
        setSelectedDate(date);
      }
      fetchAppointments(practitioner, date);
    }
  }, [rescheduleAppointment]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePractitionerChange(practitioner: Practitioner | undefined) {
    setSelectedPractitioner(practitioner);
    fetchAppointments(practitioner, selectedDate);
  }

  function handleDateChange(date: Date) {
    setSelectedDate(date);
    fetchAppointments(selectedPractitioner, date);
  }

  function handleClose() {
    setSelectedPractitioner(undefined);
    setSelectedDate(new Date());
    onClose();
  }

  return (
    <Modal.Root opened={opened} onClose={handleClose} size="100%" centered>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          {rescheduleAppointment ? (
            <Title order={3}>Rescheduling Appointment</Title>
          ) : (
            <Title order={3}>Schedule New Appointment</Title>
          )}
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <Box h="550">
            <Grid>
              <Grid.Col span={4} h="550">
                <Paper p="md" withBorder h="100%">
                  <ResourceInput
                    resourceType="Practitioner"
                    label="Select practitioner"
                    name="actor"
                    onChange={handlePractitionerChange}
                    defaultValue={selectedPractitioner}
                    required
                  />
                  <Group justify="center" pt={10}>
                    <Calendar
                      size="xl"
                      getDayProps={(date) => ({
                        selected: dayjs(date).isSame(selectedDate, 'date'),
                        onClick: () => handleDateChange(date),
                      })}
                      minDate={new Date()}
                      highlightToday
                    />
                  </Group>
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="md" h="100%" withBorder>
                  <Title order={3} mb="sm">
                    {selectedDate.toDateString()}
                  </Title>
                  <ScrollArea h="450">
                    <Box style={{ flexGrow: 1, overflowY: 'auto' }}>
                      {' '}
                      {isLoadingAppointments && <Loader />}
                      {!isLoadingAppointments &&
                        appointments.length === 0 &&
                        (selectedPractitioner ? (
                          <Text>No appointments found for this date</Text>
                        ) : (
                          <Text>Select a practitioner to see scheduled appointments</Text>
                        ))}
                      {!isLoadingAppointments &&
                        appointments.map((appointment) => (
                          <AppointmentItem key={appointment.id} appointment={appointment} />
                        ))}
                    </Box>
                  </ScrollArea>
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="md" withBorder h="100%">
                  <AppointmentForm
                    patient={patient}
                    selectedPractitioner={selectedPractitioner}
                    selectedDate={selectedDate}
                    editAppointment={rescheduleAppointment}
                    disabled={!selectedPractitioner || !selectedDate}
                    onSuccess={handleClose}
                  />
                </Paper>
              </Grid.Col>
            </Grid>
          </Box>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
