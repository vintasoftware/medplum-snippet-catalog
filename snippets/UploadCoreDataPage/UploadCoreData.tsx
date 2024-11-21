import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex, LoadingOverlay } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { MedplumClient, normalizeErrorString } from '@medplum/core';
import { Resource, ResourceType } from '@medplum/fhirtypes';
import { Document, useMedplum } from '@medplum/react';
import { IconCircleCheck, IconCircleOff } from '@tabler/icons-react';
import { FHIRResource, loadJsonFiles } from './fileLoader';


export function UploadCoreData(): JSX.Element {
  const medplum = useMedplum();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isAdmin = isProjectAdmin(medplum);

  const handleUpload = useCallback(async () => {
    setIsLoading(true);
    try {
      await uploadCoreData(medplum);
      showNotification({
        icon: <IconCircleCheck />,
        title: 'Success',
        message: 'Uploaded Core Data',
      });
    } catch (error) {
      console.error(error);
      showNotification({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: normalizeErrorString(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [medplum, navigate]);

  return (
    <Document>
      <h2>Setup</h2>
      <p>
        By clicking the "Upload Core Data" button, the system will create essential data, such as Extensions, ValueSets,
        and store them on the database.
      </p>
      <LoadingOverlay visible={isLoading} />
      {isAdmin ? (
        <Flex gap="md">
          <Button disabled={isLoading} onClick={handleUpload}>
            Upload Core Data
          </Button>
        </Flex>
      ) : (
        <p>You don't have permissions to use this page. Contact the administrator.</p>
      )}
    </Document>
  );
}

async function uploadCoreData(medplum: MedplumClient): Promise<void> {
  const uploaded: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  const CORE_DATA = loadJsonFiles();
  const resourcesStatus = await getResourceStatus(medplum, CORE_DATA);

  await Promise.all(
    CORE_DATA.map(async (resource: FHIRResource, index) => {
      if (resourcesStatus[index]) {
        skipped.push(resource.id || 'unknown');
        console.log(`Skipping existing resource: ${resource.id}`);
        return;
      }

      try {
        const result = await medplum.createResource(resource as Resource);
        if (!result.resourceType) {
          throw new Error(`Failed to upload resource: ${resource.id}`);
        }

        uploaded.push(resource.id || 'unknown');
        console.log(`Successfully uploaded: ${resource.id}`);
      } catch (error) {
        console.error(`Error processing resource ${resource.id}:`, error);
        errors.push(resource.id || 'unknown');
      }
    })
  );

  if (skipped.length || errors.length) {
    throw new Error(
      `Failed to upload core data. ${uploaded.length} succeeded, ${skipped.length} skipped, ${errors.length} errors.`
    );
  }
}

async function getResourceStatus(medplum: MedplumClient, resources: FHIRResource[]): Promise<boolean[]> {
  return Promise.all(
    resources.map(async (resource) => {
      return checkResourcesUploaded(medplum, resource);
    })
  );
}

async function checkResourcesUploaded(medplum: MedplumClient, resource: FHIRResource): Promise<boolean> {
  let check = false;
  const response = await medplum.searchResources(resource.resourceType as ResourceType, {
    url: resource.url,
  });

  if (response.bundle.entry && response.bundle.entry.length) {
    check = true;
  }

  return check;
}

function isProjectAdmin(medplum: MedplumClient): boolean {
  return medplum.isProjectAdmin();
}
