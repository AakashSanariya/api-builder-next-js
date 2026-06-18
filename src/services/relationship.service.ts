import { apiRequest } from "./api";
import { Relationship, CreateRelationshipDTO, UpdateRelationshipDTO, LinkedRecord, LinkRecordsDTO, UnlinkRecordsDTO } from "../types/relationship.types";
import { ApiResponse } from "../types/form.types";

export const relationshipService = {
  getAll: () =>
    apiRequest<ApiResponse<Relationship[]>>("/api/relationships"),

  getByFormId: (formId: string) =>
    apiRequest<ApiResponse<Relationship[]>>(`/api/relationships/${formId}`),

  create: (data: CreateRelationshipDTO) =>
    apiRequest<ApiResponse<Relationship>>("/api/relationships", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateRelationshipDTO) =>
    apiRequest<ApiResponse<Relationship>>(`/api/relationships/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<ApiResponse<any>>(`/api/relationships/${id}`, {
      method: "DELETE",
    }),

  linkRecords: (data: LinkRecordsDTO) =>
    apiRequest<ApiResponse<any>>("/api/relations/link", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  unlinkRecords: (data: UnlinkRecordsDTO) =>
    apiRequest<ApiResponse<any>>("/api/relations/unlink", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRecordLinks: (relationshipId: string, recordId: string) =>
    apiRequest<ApiResponse<LinkedRecord[]> & { relationship: Relationship }>(
      `/api/relations/${relationshipId}/${recordId}`
    ),
};
