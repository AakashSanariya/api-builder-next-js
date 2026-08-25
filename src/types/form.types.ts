import { FieldSchema, SectionSchema } from "./field.types";

export interface FormModel {
  _id?: string;
  name: string;
  slug: string;
  fields?: FieldSchema[];
  sections?: SectionSchema[];
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

export interface SubmissionRecord {
  _id: string;
  data: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SubmissionListResponse extends ApiResponse<SubmissionRecord[]> {
  pagination?: Pagination;
}

export interface SubmissionListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  /** Query keys already namespaced: f_<name>, numMin_<name>, numMax_<name>, createdFrom, createdTo */
  filters?: Record<string, string>;
}
