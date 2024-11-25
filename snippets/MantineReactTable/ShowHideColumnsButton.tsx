//Based on https://github.com/KevinVandy/mantine-react-table/blob/36bb1b3f3e74f1c4e1b0c8b180369301e28081fc/packages/mantine-react-table/src/components/buttons/MRT_ShowHideColumnsButton.tsx

import { Button, ButtonProps, Menu, Tooltip, Text } from '@mantine/core';
import { HTMLPropsRef, MRT_RowData, MRT_ShowHideColumnsMenu, MRT_TableInstance } from 'mantine-react-table';

export interface ShowHideColumnsButtonProps<TData extends MRT_RowData>
  extends ButtonProps,
    HTMLPropsRef<HTMLButtonElement> {
  table: MRT_TableInstance<TData>;
}

export const ShowHideColumnsButton = <TData extends MRT_RowData>({
  table,
  title,
  ...rest
}: ShowHideColumnsButtonProps<TData>) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icons: { IconColumns },
    localization: { showHideColumns },
  } = table.options;

  return (
    <Menu closeOnItemClick={false} withinPortal>
      <Tooltip label={title ?? showHideColumns} withinPortal>
        <Menu.Target>
          <Button aria-label={title ?? showHideColumns} color="cyan.0" {...rest}>
            <IconColumns />
            <Text fw="bold" ml="sm">
              Fields
            </Text>
          </Button>
        </Menu.Target>
      </Tooltip>
      <MRT_ShowHideColumnsMenu table={table} />
    </Menu>
  );
};
