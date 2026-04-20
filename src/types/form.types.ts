import { FieldSchema } from "./field.types";

export interface FormModel {
  _id?: string;
  name: string;
  slug: string;
  fields: FieldSchema[];
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFormDTO {
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}
