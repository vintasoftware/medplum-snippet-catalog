import { Center } from '@mantine/core';
import { Resource } from '@medplum/fhirtypes';
import { Loading, useMedplum } from '@medplum/react';
import { IconCircleCheck, IconCircleOff } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { FormChildrenProps } from './types';
import { showNotification } from '@mantine/notifications';
import { normalizeErrorString } from '@medplum/core';
import { Form } from './Form';

interface ResourceFormProps<T extends Resource> {
  children: (props: FormChildrenProps) => React.ReactNode;
  fetchResource?: () => Promise<T | undefined>;
  resourceToFormData?: (resource: T) => Record<string, any>;
  formDataToResource?: (formData: Record<string, any>) => Record<string, any>;
  onSuccess?: (resource: T) => void;
  defaultData?: T | undefined;
}

export function ResourceForm<T extends Resource>(props: ResourceFormProps<T>): JSX.Element {
  const {
    children,
    fetchResource = () => Promise.resolve(undefined),
    resourceToFormData = (resource) => resource as Record<string, any>,
    formDataToResource = (formData) => formData,
    onSuccess,
    defaultData,
  } = props;
  const medplum = useMedplum();
  const [formData, setFormData] = useState<Record<string, any> | undefined>();
  const [baseResource, setBaseResource] = useState<T | undefined>();

  useEffect(() => {
    async function callFetchResource() {
      const resource = await fetchResource();

      if (resource) {
        setFormData(resourceToFormData(resource));
        setBaseResource(resource);
      } else if (defaultData) {
        setFormData(resourceToFormData(defaultData));
        setBaseResource(defaultData);
      } else {
        setFormData({});
      }
    }

    callFetchResource();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(formData: Record<string, any>, error?: string): void {
    if (error) {
      showNotification({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: error,
      });
      return;
    }

    const resource = {
      ...baseResource,
      ...formDataToResource(formData),
    };

    let request, successMessage;
    if (resource.id) {
      request = medplum.updateResource(resource as T);
      successMessage = 'Resource edited';
    } else {
      request = medplum.createResource(resource as T);
      successMessage = 'Resource created';
    }

    request
      .then((newResource: T) => {
        setFormData(resourceToFormData(newResource));
        showNotification({
          icon: <IconCircleCheck />,
          title: 'Success',
          message: successMessage,
        });
        window.scroll(0, 0);
        onSuccess?.(newResource as T);
      })
      .catch((err) => {
        showNotification({
          color: 'red',
          icon: <IconCircleOff />,
          title: 'Error',
          message: normalizeErrorString(err),
        });
      });
  }

  if (!formData) {
    return (
      <Center h="100%">
        <Loading />
      </Center>
    );
  }

  return (
    <Form onSubmit={handleSubmit} defaultData={formData}>
      {children}
    </Form>
  );
}
