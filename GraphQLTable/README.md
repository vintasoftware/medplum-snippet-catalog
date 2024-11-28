# GraphQL Table Component

> **Warning**
> This component is currently under active development, there are still a lot of missing functionality

A flexible table component built on top of Mantine's Table component with support for pagination, filtering, and sorting. The component is designed to work with Medplum's GraphQL API.

## Features

- Pagination support
- Custom column rendering
- Filtering support via FHIR search parameters
- Sorting support
- Configurable page size

## Missing Functionalities

1. Column sorting
2. Row selection
3. Bulk actions
4. Column resizing
5. Basic column filtering
6. Remove dependency on fixed query names and parameters

## Sample Usage

```tsx
import { Text, Menu, ActionIcon } from '@mantine/core';
import { Filter, formatDateTime, normalizeErrorString, parseReference } from '@medplum/core';
import { HumanNameDisplay, useMedplum } from '@medplum/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Patient, Practitioner, Task } from '@medplum/fhirtypes';
import {
  IconCalendarClock,
  IconCircleCheck,
  IconDots,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useReducer } from 'react';
import Table from './Table';

/**
 * Top level query must be named PaginatedQuery and receive the parameters used in this example.
 */
const TASK_LIST_GQL = `
query PaginatedQuery($offset: Int, $count: Int, $filters: String, $sort: String) { 
  TaskConnection(
    _offset: $offset
    _count: $count
    _filter: $filters
    _sort: $sort
  ) {
    count 
    offset 
    pageSize
    edges {
      resource {
        resourceType
        id
        description
        status
        restriction {
          period {
            start
            end
          }
        }
        for {
          reference
          resource {
            ... on Patient {
              resourceType
              id
              name {
                given
                family
              }
            }
          }
        }
        requester {
          reference
          resource {
            ... on Practitioner {
              resourceType
              id
              name {
                given
                family
              }
            }
          }
        }
        owner {
          reference
          resource {
            ... on Practitioner {
              resourceType
              id
              name {
                given
                family
              }
            }
          }
        }
      }
    }
  }
}
`;

interface TaskListProps {
  filters?: Filter[];
  hidePatientColumn?: boolean;
  onStatusChange?: (task: Task, status: Task['status']) => void;
}

export function TaskList(props: TaskListProps): JSX.Element {
  const medplum = useMedplum();
  const navigate = useNavigate();
  const { filters, hidePatientColumn = false, onStatusChange } = props;
  const [refreshSeed, forceUpdate] = useReducer((x) => x + 1, 0);

  async function handleStatusChange(task: Task, status: Task['status']) {
    try {
      const freshTask = await medplum.readResource('Task', task.id as string);
      await medplum.updateResource({
        ...freshTask,
        status,
      } as Task);

      notifications.show({
        title: 'Task status changed',
        message: `The task has been marked as ${status}`,
        color: 'green',
      });

      forceUpdate();

      if (onStatusChange) {
        onStatusChange(freshTask, status);
      }
    } catch (err) {
      notifications.show({
        title: 'Error updating task status',
        message: normalizeErrorString(err),
        color: 'red',
      });
    }
  }

  return (
    <Table
      paginatedGraphqlQuery={TASK_LIST_GQL} // GraphQL query
      queryResultType="TaskConnection" // Name of the connection type in the GraphQL query
      filters={filters} // FHIR style filters
      sort="due-date" // FHIR style sort
      refreshSeed={refreshSeed} // Optional value that triggers a table refresh when changed
    >
      <Table.Column header="Description">
        {/* Column receives a render function that receives the row data and returns a React element */}
        {(row: Task) => {
          return <Text>{row.description}</Text>;
        }}
      </Table.Column>
      {!hidePatientColumn && (
        <Table.Column header="Patient">
          {(row: Task) => {
            const patient = row.for?.resource as Patient | undefined;
            return (
              <NavLink to={`/Patient/${patient?.id}/tasks`}>
                <HumanNameDisplay value={patient?.name?.[0]} />
              </NavLink>
            );
          }}
        </Table.Column>
      )}
      <Table.Column header="Requester">
        {(row: Task) => {
          const practitioner = row.requester?.resource as Practitioner | undefined;
          return <HumanNameDisplay value={practitioner?.name?.[0]} />;
        }}
      </Table.Column>
      <Table.Column header="Owner">
        {(row: Task) => {
          const practitioner = row.owner?.resource as Practitioner | undefined;
          return <HumanNameDisplay value={practitioner?.name?.[0]} />;
        }}
      </Table.Column>
      <Table.Column header="Due date">
        {(row: Task) => {
          return (
            <Text>
              {formatDateTime(row.restriction?.period?.end, undefined, {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </Text>
          );
        }}
      </Table.Column>
      <Table.Column header="Status">
        {(row: Task) => {
          return <Text>{row.status}</Text>;
        }}
      </Table.Column>
      <Table.Column header="Actions" align="right">
        {(row: Task) => {
          return (
            <Menu shadow="lg" position="bottom-end" offset={0} withArrow>
              <Menu.Target>
                <ActionIcon variant="subtle">
                  <IconDots />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown ta="right">
                {row.status !== 'completed' && (
                  <Menu.Item color="green" onClick={() => handleStatusChange(row, 'completed')}>
                    <IconCircleCheck size={16} /> Mark as completed
                  </Menu.Item>
                )}
                {row.status !== 'in-progress' && (
                  <Menu.Item color="blue" onClick={() => handleStatusChange(row, 'in-progress')}>
                    <IconPlayerPlay size={16} /> Mark as in progress
                  </Menu.Item>
                )}
                {row.status !== 'on-hold' && (
                  <Menu.Item color="yellow" onClick={() => handleStatusChange(row, 'on-hold')}>
                    <IconPlayerPause size={16} /> Mark as on hold
                  </Menu.Item>
                )}
                {row.status !== 'failed' && (
                  <Menu.Item color="red" onClick={() => handleStatusChange(row, 'failed')}>
                    <IconX size={16} /> Mark as failed
                  </Menu.Item>
                )}
                <Menu.Item
                  onClick={() => {
                    const [, patientId] = parseReference(row.for);
                    navigate(`/Patient/${patientId}/tasks/${row.id}`);
                  }}
                >
                  <IconCalendarClock size={16} /> View details
                </Menu.Item>
                <Menu.Item
                  onClick={() => {
                    const [, patientId] = parseReference(row.for);
                    navigate(`/Patient/${patientId}/tasks/${row.id}/edit`);
                  }}
                >
                  <IconPencil size={16} /> Edit
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          );
        }}
      </Table.Column>
    </Table>
  );
}
```
