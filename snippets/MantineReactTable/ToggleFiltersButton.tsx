//Based on https://github.com/KevinVandy/mantine-react-table/blob/36bb1b3f3e74f1c4e1b0c8b180369301e28081fc/packages/mantine-react-table/src/components/buttons/MRT_ToggleFiltersButton.tsx

import { Button, ButtonProps, Tooltip, Text } from '@mantine/core';
import { HTMLPropsRef, MRT_RowData, MRT_TableInstance } from 'mantine-react-table';

export interface ToggleFiltersButtonProps<TData extends MRT_RowData>
  extends ButtonProps,
    HTMLPropsRef<HTMLButtonElement> {
  table: MRT_TableInstance<TData>;
}

export const ToggleFiltersButton = <TData extends MRT_RowData>({
  table: {
    getState,
    options: {
      icons: { IconFilter, IconFilterOff },
      localization: { showHideFilters },
    },
    setShowColumnFilters,
  },
  title,
  ...rest
}: ToggleFiltersButtonProps<TData>) => {
  const { showColumnFilters } = getState();

  return (
    <Tooltip label={title ?? showHideFilters} withinPortal>
      <Button
        aria-label={title ?? showHideFilters}
        color="cyan.0"
        onClick={() => setShowColumnFilters((current) => !current)}
        {...rest}
      >
        {showColumnFilters ? <IconFilterOff /> : <IconFilter />}
        <Text fw="bold" ml="sm">
          Filters
        </Text>
      </Button>
    </Tooltip>
  );
};
