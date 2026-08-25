import { apiRequest } from "./api";
import { FormModel, ApiResponse, SubmissionListParams, SubmissionListResponse } from "../types/form.types";
import { SectionSchema } from "../types/field.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const buildSubmissionQuery = (params: SubmissionListParams = {}): string => {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.sortField) qs.set("sortField", params.sortField);
  if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
  Object.entries(params.filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
};

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

  submitDynamicFormJSON: (slug: string, data: Record<string, any>) =>
    apiRequest<ApiResponse<any>>(`/api/${slug}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDynamicSubmissionById: (slug: string, recordId: string) =>
    apiRequest<ApiResponse<{ _id: string; data: Record<string, any> }>>(
      `/api/${slug}/data/${recordId}`
    ),

  listDynamicSubmissions: (slug: string, params: SubmissionListParams = {}) => {
    const qs = buildSubmissionQuery(params);
    return apiRequest<SubmissionListResponse>(`/api/${slug}/data${qs ? `?${qs}` : ""}`);
  },

  updateDynamicSubmission: (slug: string, recordId: string, data: FormData) =>
    authFetch(`${BASE_URL}/api/${slug}/data/${recordId}`, {
      method: "PUT",
      body: data,
    }),

  deleteDynamicSubmission: (slug: string, recordId: string) =>
    authFetch(`${BASE_URL}/api/${slug}/data/${recordId}`, {
      method: "DELETE",
    }),

  bulkDeleteSubmissions: (slug: string, ids: string[]) =>
    apiRequest<ApiResponse<{ deletedCount: number }>>(`/api/${slug}/data/bulk-delete`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  /** Downloads a CSV blob honoring current filters, or an explicit id selection */
  exportSubmissionsCsv: async (
    slug: string,
    opts: {
      search?: string;
      sortField?: string;
      sortOrder?: "asc" | "desc";
      filters?: Record<string, string>;
      ids?: string[];
    } = {}
  ): Promise<Blob> => {
    const qs = new URLSearchParams();
    if (opts.search?.trim()) qs.set("search", opts.search.trim());
    if (opts.sortField) qs.set("sortField", opts.sortField);
    if (opts.sortOrder) qs.set("sortOrder", opts.sortOrder);
    Object.entries(opts.filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        qs.set(key, String(value));
      }
    });
    if (opts.ids && opts.ids.length > 0) qs.set("ids", opts.ids.join(","));

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(`${BASE_URL}/api/${slug}/data/export${qs.toString() ? `?${qs}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    return res.blob();
  },

  deleteForm: (id: string) =>
    apiRequest<ApiResponse<any>>(`/${id}`, {
      method: "DELETE",
    }),
};
