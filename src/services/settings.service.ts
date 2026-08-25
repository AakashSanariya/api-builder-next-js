import { apiRequest } from "./api";
import { ApiResponse } from "../types/form.types";
import {
  UserProfile,
  UpdateProfileDTO,
  ChangePasswordDTO,
  ApiKey,
  CreateApiKeyDTO,
  CreateApiKeyResponse,
} from "../types/settings.types";

export const settingsService = {
  updateProfile: (data: UpdateProfileDTO) =>
    apiRequest<ApiResponse<UserProfile>>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  changePassword: (data: ChangePasswordDTO) =>
    apiRequest<ApiResponse<null>>("/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAccount: (email: string) =>
    apiRequest<ApiResponse<null>>("/auth/account", {
      method: "DELETE",
      body: JSON.stringify({ email }),
    }),

  listApiKeys: () =>
    apiRequest<ApiResponse<ApiKey[]>>("/auth/api-keys"),

  createApiKey: (data: CreateApiKeyDTO) =>
    apiRequest<ApiResponse<CreateApiKeyResponse>>("/auth/api-keys", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  revokeApiKey: (id: string) =>
    apiRequest<ApiResponse<null>>(`/auth/api-keys/${id}`, {
      method: "DELETE",
    }),
};
