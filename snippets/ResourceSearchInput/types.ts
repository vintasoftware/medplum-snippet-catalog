import { ExtractResource, ResourceType } from "@medplum/fhirtypes";

import { TextInputProps } from "@mantine/core";

export interface ResourceSearchInputProps<K extends ResourceType> extends TextInputProps {
  resourceType: K;
  search: string;
  maxResults?: number;
  minInputLength?: number;
  onSearch: (selected: ExtractResource<K>) => void;
}