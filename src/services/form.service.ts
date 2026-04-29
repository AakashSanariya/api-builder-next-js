import { apiRequest } from "./api";
import { FormModel, ApiResponse } from "../types/form.types";
import { FieldSchema, SectionSchema } from "../types/field.types";

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

  updateSchema: (id: string, sections: SectionSchema[], published: boolean) => 
    apiRequest<ApiResponse<FormModel>>(`/${id}`, {
      method: "POST",
      body: JSON.stringify({ sections, published }),
    }),

  submitDynamicForm: (slug: string, data: FormData) => 
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/${slug}`, {
      method: "POST",
      body: data, // Multer handles FormData
    }).then(res => res.json()),

  getDynamicSubmissionById: (slug: string, recordId: string) =>
    apiRequest<ApiResponse<{ _id: string; data: Record<string, any> }>>(
      `/api/${slug}/data/${recordId}`
    ),

  listDynamicSubmissions: (slug: string, page: number = 1, limit: number = 20) =>
    apiRequest<ApiResponse<Array<{ _id: string; data: Record<string, any>; createdAt?: string }>>>(
      `/api/${slug}/data?page=${page}&limit=${limit}`
    ),

  updateDynamicSubmission: (slug: string, recordId: string, data: FormData) =>
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/${slug}/data/${recordId}`,
      {
        method: "PUT",
        body: data,
      }
    ).then((res) => res.json()),

  deleteDynamicSubmission: (slug: string, recordId: string) =>
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/${slug}/data/${recordId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    ).then((res) => res.json()),

  deleteForm: (id: string) =>
    apiRequest<ApiResponse<any>>(`/${id}`, {
      method: "DELETE",
    }),
};
