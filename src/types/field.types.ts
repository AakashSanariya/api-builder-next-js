export type FieldType =
  | "input"
  | "radio"
  | "checkbox"
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
}

export interface FieldSchema {
  id: string;
  type: FieldType;
  label: string;
  name: string; // unique API key
  validations?: FieldValidation;
  options?: FieldOption[];
  multiple?: boolean;
}
