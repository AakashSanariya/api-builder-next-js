import { FieldSchema } from "../types/field.types";

/**
 * Frontend Validation Utility
 * Mirrors backend logic for real-time user feedback.
 */
export const validateField = (field: FieldSchema, value: any): string | null => {
  const { validations, label } = field;
  if (!validations) return null;

  // 1. Required Check
  if (validations.required && (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0))) {
    return `${label} is required`;
  }

  // Skip others if empty
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  // 2. Length Checks
  if (validations.minLength && value.length < validations.minLength) {
    return `${label} must be at least ${validations.minLength} characters`;
  }
  if (validations.maxLength && value.length > validations.maxLength) {
    return `${label} cannot exceed ${validations.maxLength} characters`;
  }

  // 3. Pattern Check
  if (validations.pattern) {
    try {
      const regex = new RegExp(validations.pattern);
      if (!regex.test(value)) {
        return `${label} format is invalid`;
      }
    } catch (e) {
      console.error("Invalid regex pattern:", validations.pattern);
    }
  }

  return null;
};

export const validateForm = (fields: FieldSchema[], data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  fields.forEach((field) => {
    const error = validateField(field, data[field.name]);
    if (error) errors[field.name] = error;
  });
  return errors;
};
