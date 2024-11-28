import React, { useCallback, useEffect, useState } from 'react';
import { Box, Center, Loader, MantineStyleProp, Table as MantineTable, Pagination, Text } from '@mantine/core';
import { Resource } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { Filter } from '@medplum/core';
import { filtersToFhirFilterString } from '../utils/filters';

interface PaginatedQueryResult<T extends Resource> {
  count: number;
  offset: number;
  pageSize: number;
  edges: T[];
}

interface ColumnProps<T extends Resource> {
  children: (row: T) => React.ReactElement;
  header: string;
  align?: 'center' | 'left' | 'right' | 'justify' | 'char';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Column<T extends Resource>(props: ColumnProps<T>): JSX.Element {
  return <></>;
}

interface TableProps<T extends Resource> {
  children: (React.ReactElement<ColumnProps<T>> | null | undefined | boolean)[] | React.ReactElement<ColumnProps<T>>;
  paginatedGraphqlQuery: string;
  queryResultType: string;
  filters?: Filter[];
  sort?: string;
  pageSize?: number;
  refreshSeed?: number;
}

export default function Table<T extends Resource>(props: TableProps<T>): JSX.Element {
  const { children, paginatedGraphqlQuery, queryResultType, filters, sort, pageSize = 20, refreshSeed } = props;
  const medplum = useMedplum();
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<PaginatedQueryResult<T> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const parseQueryResult = useCallback(
    (data: object): PaginatedQueryResult<T> => {
      const connectionNode = (data as any)[queryResultType];
      return {
        count: connectionNode.count,
        offset: connectionNode.offset,
        pageSize: connectionNode.pageSize,
        edges: connectionNode.edges.map((edge: object) => (edge as any).resource),
      };
    },
    [queryResultType]
  );

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const result = await medplum.graphql(paginatedGraphqlQuery, 'PaginatedQuery', {
        offset,
        count: pageSize,
        filters: filters ? filtersToFhirFilterString(filters) : undefined,
        sort: sort,
      });
      setQueryResult(parseQueryResult(result.data));
      setIsLoading(false);
    };

    fetchResources();
  }, [medplum, paginatedGraphqlQuery, parseQueryResult, currentPage, pageSize, filters, sort, refreshSeed]);

  const columns = React.Children.toArray(children) as React.ReactElement<ColumnProps<T>>[];

  return (
    <Box mih={500} pos="relative" pb={90}>
      <MantineTable>
        <MantineTable.Thead>
          <MantineTable.Tr>
            {columns.map((column, index) => (
              <MantineTable.Th key={index}>
                <Text fw="bold" style={{ textAlign: column.props.align } as MantineStyleProp}>
                  {column.props.header}
                </Text>
              </MantineTable.Th>
            ))}
          </MantineTable.Tr>
        </MantineTable.Thead>
        <MantineTable.Tbody>
          {isLoading ? (
            <MantineTable.Tr>
              <MantineTable.Td pt="150" align="center" h="100%" colSpan={columns.length}>
                <Loader />
              </MantineTable.Td>
            </MantineTable.Tr>
          ) : (
            queryResult?.edges.map((row: T, rowIndex: number) => (
              <MantineTable.Tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <MantineTable.Td key={colIndex} align={column.props.align}>
                    {column.props.children(row)}
                  </MantineTable.Td>
                ))}
              </MantineTable.Tr>
            ))
          )}
        </MantineTable.Tbody>
      </MantineTable>
      {queryResult && (
        <Center m="md" p="md" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <Pagination
            total={Math.ceil((queryResult.count ?? 1) / (queryResult.pageSize ?? 1))}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Center>
      )}
    </Box>
  );
}

Table.Column = Column;
