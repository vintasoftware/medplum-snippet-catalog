type ImportMetaGlob = Record<string, () => Promise<any>>;

export interface FHIRResource {
  resourceType: string;
  id?: string;
  url?: string;
  version?: string;
  name?: string;
  title?: string;
  status?: string;
  experimental?: boolean;
  date?: string;
  publisher?: string;
  description?: string;
  [key: string]: unknown; // Allow for additional properties
}

/**
 * Represents the structure of a JSON file with a required id field
 */
export type JsonFile = {
  id: string;
  [key: string]: unknown;
};

/**
 * Loads all JSON files from a specified directory
 * @param options Configuration options for loading
 * @returns Object containing loaded and processed JSON data
 */
export const loadJsonFiles = (): FHIRResource[] => {
  // Use Vite's glob import feature to get all JSON files
  const files: ImportMetaGlob = import.meta.glob('/data/fhir/seed-data/**/*.json', {
    eager: true,
    import: 'default',
  });

  const jsonData: FHIRResource[] = [];
  for (const module of Object.values(files)) {
    jsonData.push(module as unknown as FHIRResource);
  }

  return jsonData;
};
