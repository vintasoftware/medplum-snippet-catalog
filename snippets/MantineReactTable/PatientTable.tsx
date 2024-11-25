import { ResourceAvatar, useMedplum, useMedplumNavigate } from '@medplum/react';
import {
  useMantineReactTable,
  MRT_ColumnFiltersState,
  MRT_SortingState,
  MRT_ColumnDef,
  MRT_TablePagination,
  MRT_TableContainer,
  MRT_ProgressBar,
} from 'mantine-react-table';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Badge, Center, Flex, Group, Title, useMantineTheme } from '@mantine/core';
import { IconAdjustmentsHorizontal, IconColumns, IconFilter, IconFilterOff, IconUsersGroup } from '@tabler/icons-react';
import { ToggleFiltersButton } from './ToggleFiltersButton';
import { ShowHideColumnsButton } from './ShowHideColumnsButton';
import { GlobalFilterTextInput } from './GlobalFilterTextInput';
import { graphqlQuery, GraphQLQueryResponse, GraphQLQueryResponsePatient } from './PatientTable.graphql';
import { HumanName } from '@medplum/fhirtypes';

// If using CSS modules, import the styles here
// import classes from './PatientTable.module.css';

const classes = {
  patientTable: 'patientTable',
  tableHeadCell: 'tableHeadCell',
  pagination: 'pagination',
}

const formatName = (name?: HumanName | HumanName[]) => {
  if (!name) {
    return '';
  }

  const _name = Array.isArray(name) ? name[0] : name;
  return `${_name.given?.[0]} ${_name.family}`;
};

export function PatientTable() {
  const medplum = useMedplum();
  const navigate = useMedplumNavigate();
  const theme = useMantineTheme();

  const [data, setData] = useState<GraphQLQueryResponsePatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [rowCount, setRowCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const columns = useMemo<MRT_ColumnDef<GraphQLQueryResponsePatient>[]>(() => {
    return [
      {
        header: 'Client',
        id: 'name',
        accessorFn: (row) => ({
          name: formatName(row.name),
          photoURL: row.photo?.[0]?.url,
        }),
        mantineTableBodyCellProps: { style: { fontWeight: 'bold' } },
        Cell: ({ cell }) => {
          const value = cell.getValue() as { name: string; photoURL: string };
          return (
            <Center inline>
              <ResourceAvatar src={value.photoURL} alt={value.name} mr="0.5rem" />
              {value.name}
            </Center>
          );
        },
      },
      {
        header: 'Caregivers',
        id: 'RelatedPersonList.name',
        accessorFn: (row) => row.RelatedPersonList?.map((relatedPerson) => formatName(relatedPerson.name)),
        Cell: ({ cell }) => {
          const names = cell.getValue() as string[];

          return <Flex direction="column">{names?.map((name, index) => <span key={index}>{name}</span>)}</Flex>;
        },
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: 'Join date',
        id: 'meta.lastUpdated',
        accessorFn: (row) => {
          const joinDate = row.joinDate?.[0]?.valueDateTime;
          if (!joinDate) return '';
          return dayjs(joinDate).format('MM/DD/YYYY');
        },
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: 'Last session',
        id: 'lastEncounter.date',
        accessorFn: (row) => row.lastEncounter?.[0]?.period?.end && dayjs(row.lastEncounter[0].period.end).fromNow(),
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: 'Status',
        accessorFn: (row) => {
          const status = row.status?.[0]?.valueString;
          return status || '';
        },
        enableColumnActions: false,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => (
          <Badge size="lg" fullWidth fw={400}>
            {renderedCellValue}
          </Badge>
        ),
      },
    ];
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!data.length) {
        setIsLoading(true);
      } else {
        setIsRefetching(true);
      }

      const offset = pageIndex * pageSize;

      const rootFilters = [];

      for (const columnFilter of columnFilters) {
        if (columnFilter.id === 'name') {
          rootFilters.push(`name co "${columnFilter.value as string}"`);
        }
      }

      const mappedSorting = sorting
        .map(({ id, desc }) => {
          return `${desc ? '-' : ''}${id}`;
        })
        .join(',');

      if (globalFilter) {
        rootFilters.push(`name co "${globalFilter}"`);
      }

      // If we send `filter: ""`, the query fails with the message "Cant consume unknown more tokens."
      const mappedFilters = rootFilters.join(' and ') || undefined;

      const graphqlResult = (await medplum.graphql(graphqlQuery, 'PaginatedQuery', {
        offset,
        count: pageSize,
        filters: mappedFilters,
        sorting: mappedSorting,
      })) as GraphQLQueryResponse;

      if (graphqlResult.errors) {
        setError(graphqlResult.errors.map((e) => e.message).join(', '));
      } else {
        const result = graphqlResult.data.PatientConnection;

        setRowCount(result.count);
        setPageSize(result.pageSize);

        setData(result.edges.map(({ resource }) => ({ ...resource })));
        setError(null);
      }

      setIsLoading(false);
      setIsRefetching(false);
    };

    void fetchPatients();
  }, [sorting, pageIndex, columnFilters, globalFilter]);

  const table = useMantineReactTable({
    columns,
    data,
    rowCount,
    enableGlobalFilter: true,
    enableGlobalFilterModes: true,
    state: {
      isLoading,
      columnFilters,
      globalFilter,
      sorting,
      pagination: { pageIndex, pageSize },
      showAlertBanner: !!error,
      showProgressBars: isRefetching,
      showGlobalFilter: true,
    },
    mantineToolbarAlertBannerProps: error ? { color: 'red', children: error } : undefined,

    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => navigate(`/Patient/${row.original.id}`),
      style: { cursor: 'pointer' },
    }),
    mantineTableHeadCellProps: { className: classes.tableHeadCell },

    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(newPagination.pageIndex);
      setPageSize(newPagination.pageSize);
    },
    onSortingChange: setSorting,

    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: () => (
      <div>
        <a>View chart</a>
      </div>
    ),

    icons: {
      IconDotsVertical: (props: Record<string, unknown>) => <IconAdjustmentsHorizontal {...props} />,
      IconFilter: (props: Record<string, unknown>) => <IconFilter color={theme.colors.cyan[9]} {...props} />,
      IconFilterOff: (props: Record<string, unknown>) => <IconFilterOff color={theme.colors.cyan[9]} {...props} />,
      IconColumns: (props: Record<string, unknown>) => <IconColumns color={theme.colors.cyan[9]} {...props} />,
    },

    // Enable server side pagination, filtering and sorting
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,

    paginationDisplayMode: 'pages',
    mantinePaginationProps: {
      showRowsPerPage: false,
      withControls: false, // Don't show pagination arrows
      radius: 'xl',
      size: 'lg',
      color: 'cyan.9',
      autoContrast: true,
    },
  });

  return (
    <div className={classes.patientTable}>
      <Flex justify="space-between">
        <Title display="flex" mb="1.75rem">
          <IconUsersGroup color={theme.colors.cyan[7]} size="2.5rem" stroke={1.5} style={{ marginRight: '0.75rem' }} />
          Clients
        </Title>
        <Flex>
          <Group style={{ gap: 'sm' }}>
            <GlobalFilterTextInput table={table} />
            <ShowHideColumnsButton table={table} />
            <ToggleFiltersButton table={table} />
          </Group>
        </Flex>
      </Flex>
      <div style={{ position: 'relative' }}>
        <MRT_ProgressBar isTopToolbar={true} table={table} />
      </div>
      <MRT_TableContainer table={table} />
      <MRT_TablePagination className={classes.pagination} table={table} />
    </div>
  );
}
