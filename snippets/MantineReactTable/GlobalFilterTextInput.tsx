import { MRT_GlobalFilterTextInput, MRT_RowData, MRT_TableInstance } from 'mantine-react-table';
import classes from './GlobalFilterTextInput.module.css';
import { Badge } from '@mantine/core';

export const GlobalFilterTextInput = <TData extends MRT_RowData>({ table }: { table: MRT_TableInstance<TData> }) => {
  return (
    <Badge color="white" size="xl" className={classes.globalFilter}>
      <MRT_GlobalFilterTextInput table={table} />
    </Badge>
  );
};
