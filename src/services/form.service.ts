import { apiRequest } from "./api";
import { FormModel, ApiResponse } from "../types/form.types";
import { SectionSchema } from "../types/field.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const authFetch = (url: string, options: RequestInit = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, { ...options, headers }).then((res) => res.json());
};

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
    authFetch(`${BASE_URL}/api/${slug}`, {
      method: "POST",
      body: data,
    }),

  getDynamicSubmissionById: (slug: string, recordId: string) =>
    apiRequest<ApiResponse<{ _id: string; data: Record<string, any> }>>(
      `/api/${slug}/data/${recordId}`
    ),

  listDynamicSubmissions: (slug: string, page: number = 1, limit: number = 20) =>
    apiRequest<ApiResponse<Array<{ _id: string; data: Record<string, any>; createdAt?: string }>>>(
      `/api/${slug}/data?page=${page}&limit=${limit}`
    ),

  updateDynamicSubmission: (slug: string, recordId: string, data: FormData) =>
    authFetch(`${BASE_URL}/api/${slug}/data/${recordId}`, {
      method: "PUT",
      body: data,
    }),

  deleteDynamicSubmission: (slug: string, recordId: string) =>
    authFetch(`${BASE_URL}/api/${slug}/data/${recordId}`, {
      method: "DELETE",
    }),

  deleteForm: (id: string) =>
    apiRequest<ApiResponse<any>>(`/${id}`, {
      method: "DELETE",
    }),
};
