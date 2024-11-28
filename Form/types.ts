export type FormInputOnChange = (path: string, data: any, error?: string) => void;

export interface FormChildrenProps {
  onChange: FormInputOnChange;
  defaultData?: any;
}
