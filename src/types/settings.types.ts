export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateProfileDTO {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface ApiKey {
  _id: string;
  name: string;
  keyPreview: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyDTO {
  name: string;
}

export interface CreateApiKeyResponse {
  _id: string;
  name: string;
  key: string;
  createdAt: string;
}
