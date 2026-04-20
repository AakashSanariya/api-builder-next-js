import { apiRequest } from "./api";
import { FormModel, ApiResponse } from "../types/form.types";
import { FieldSchema } from "../types/field.types";

export const formService = {
  getAllForms: () => 
    apiRequest<ApiResponse<FormModel[]>>("/"),

  getFormById: (id: string) => 
    apiRequest<ApiResponse<FormModel>>(`/${id}`),

  getFormBySlug: (slug: string) => 
    apiRequest<ApiResponse<FormModel>>(`/${slug}`),

  createForm: (name: string) => 
    apiRequest<ApiResponse<FormModel>>("/", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  updateSchema: (id: string, fields: FieldSchema[], published: boolean) => 
    apiRequest<ApiResponse<FormModel>>(`/${id}`, {
      method: "POST",
      body: JSON.stringify({ fields, published }),
    }),

  submitDynamicForm: (slug: string, data: FormData) => 
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/${slug}`, {
      method: "POST",
      body: data, // Multer handles FormData
    }).then(res => res.json()),
};
