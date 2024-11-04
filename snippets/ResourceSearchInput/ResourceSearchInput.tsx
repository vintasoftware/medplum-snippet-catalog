/* Based on:
- https://mantine.dev/combobox/?e=AsyncAutocomplete;
- https://github.com/medplum/medplum/blob/main/packages/react/src/ResourceInput/ResourceInput.tsx;
- https://github.com/medplum/medplum/blob/main/packages/react/src/AsyncAutocomplete/AsyncAutocomplete.tsx;
*/
import React, { useRef, useState } from "react";

import { getDisplayString, isEmpty } from "@medplum/core";
import { ExtractResource, ResourceType } from "@medplum/fhirtypes";
import { useMedplum } from "@medplum/react";

import { Combobox, Loader, rem, TextInput, useCombobox } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";

import { IconSearch } from "@tabler/icons-react";

import { ResourceSearchInputProps } from "./types";

const DEBOUNCE_DELAY_MS = 500;

export default function ResourceSearchInput<K extends ResourceType>({
  resourceType,
  search,
  onSelect,
  minInputLength = 2,
  ...props
}: ResourceSearchInputProps<K>) {
  const medplum = useMedplum();

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<string, ExtractResource<K>>>({});
  const [value, setValue] = useState("");
  const [empty, setEmpty] = useState(false);

  const abortController = useRef<AbortController>();
  const fetchOptions = useDebouncedCallback(async (query: string) => {
    if (query.length < minInputLength) {
      return;
    }

    abortController.current?.abort();
    abortController.current = new AbortController();
    setIsLoading(true);

    const response = await medplum.search(resourceType, {
      [search]: query,
    });
    setEmpty(response.entry?.length === 0);
    setIsLoading(false);
    abortController.current = undefined;
    const data = response.entry?.reduce<Record<string, ExtractResource<K>>>(
      (result, entry) => ({
        ...result,
        [entry.resource!.id!]: entry.resource!,
      }),
      {},
    );
    setData(data || {});
  }, DEBOUNCE_DELAY_MS);

  const handleOptionSubmit = (resourceId: string) => {
    setValue("");
    combobox.closeDropdown();
    if (!data) return;

    onSelect(data[resourceId]);
    setData({});
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value);
    fetchOptions(event.currentTarget.value);
    combobox.resetSelectedOption();
    combobox.openDropdown();
  };

  const handleClick = () => combobox.openDropdown();

  const handleFocus = () => {
    combobox.openDropdown();
    if (data === null) {
      fetchOptions(value);
    }
  };

  const handleBlur = () => combobox.closeDropdown();
  return (
    <Combobox onOptionSubmit={handleOptionSubmit} withinPortal={false} store={combobox}>
      <Combobox.Target>
        <TextInput
          placeholder="Search"
          {...props}
          value={value}
          onChange={handleChange}
          onClick={handleClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rightSection={
            isLoading ? (
              <Loader size={18} />
            ) : (
              <IconSearch style={{ width: rem(18), height: rem(18) }} />
            )
          }
        />
      </Combobox.Target>
      <Combobox.Dropdown hidden={isEmpty(data) && !empty}>
        <Combobox.Options>
          {!isEmpty(data) &&
            Object.values(data).map((resource) => (
              <Combobox.Option value={resource.id!} key={resource.id!}>
                {getDisplayString(resource)}
              </Combobox.Option>
            ))}
          {empty && <Combobox.Empty>No results found</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
