"use client";

import { useState, useCallback } from "react";
import { FieldSchema } from "../types/field.types";
import { validateField, validateForm } from "../utils/validation";

export const useValidation = (fields: FieldSchema[]) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((data: Record<string, any>) => {
    const newErrors = validateForm(fields, data);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields]);

  const validateSingleField = useCallback((field: FieldSchema, value: any) => {
    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field.name]: error || "",
    }));
    return !error;
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  return {
    errors,
    setErrors,
    validate,
    validateSingleField,
    clearErrors,
  };
};
