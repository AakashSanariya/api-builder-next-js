export type FieldType =
  | "input"
  | "radio"
  | "checkbox"
  | "select"
  | "textarea"
  | "file"
  | "button"
  | "link";

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FieldOption {
  label: string;
  value: string | number;
  id?: string;
  [key: string]: any;
}

export interface FieldSchema {
  id: string;
  type: FieldType;
  label: string;
  name: string; // unique API key
  validations?: FieldValidation;
  options?: FieldOption[];
  multiple?: boolean;
  url?: string;
  target?: "_blank" | "_self";
  value?: string;
}

export interface SectionSchema {
  id: string;
  title: string;
  fields: FieldSchema[];
}
