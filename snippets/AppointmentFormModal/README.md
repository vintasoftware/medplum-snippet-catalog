# AppointmentFormModal Component

A reusable modal component for creating and editing FHIR Appointment resources. Built on top of the Form component. This component allows scheduling appointments but does not uses `Schedule` and `Slot` resources so it might only be suitable for some specific use cases, use with caution or customize to your needs.

<img width="1361" alt="Screenshot 2024-11-04 at 17 57 05" src="https://github.com/user-attachments/assets/b5898079-acc7-48e3-8cb2-abe389df9d02">


## Basic Usage

```tsx
tsx;
import { AppointmentFormModal } from './AppointmentFormModal';
function MyScheduler() {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button onClick={() => setOpened(true)}>Schedule Appointment</Button>
      <AppointmentFormModal
        /*
         * Optional: fixate the patient for the appointment
         */
        patient={patient}
        /*
         * Optional: set an appointment to be edited (rescheduled).
         * If not set, a new appointment will be created.
         */
        rescheduleAppointment={rescheduleAppointment}
        opened={createModalOpened}
        onClose={() => setOpened(false))}
      />
    </>
  );
}
```

## Notes

- The modal uses the ResourceForm component internally to handle FHIR resource creation/updates but this can be easily replaced with a custom form.
