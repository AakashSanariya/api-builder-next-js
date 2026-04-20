/**
 * Schema-driven validation engine
 */
const validateData = (schema, data) => {
  const errors = {};

  schema.forEach((field) => {
    const { name, label, validations, type } = field;
    const value = data[name];

    if (!validations) return;

    // 1. Required check
    if (validations.required && (value === undefined || value === null || value === "")) {
      errors[name] = `${label} is required`;
      return;
    }

    // Skip further validations if empty and not required
    if (value === undefined || value === null || value === "") return;

    // 2. Length checks
    if (validations.minLength && value.length < validations.minLength) {
      errors[name] = `${label} must be at least ${validations.minLength} characters`;
    }
    if (validations.maxLength && value.length > validations.maxLength) {
      errors[name] = `${label} cannot exceed ${validations.maxLength} characters`;
    }

    // 3. Pattern check
    if (validations.pattern) {
      try {
        const regex = new RegExp(validations.pattern);
        if (!regex.test(value)) {
          errors[name] = `${label} format is invalid`;
        }
      } catch (e) {
        console.error(`Invalid pattern for field ${name}:`, validations.pattern);
      }
    }
    
    // 4. File specific validation (basic)
    if (type === "file" && !value) {
        // Handled by required check, but could add more here
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = validateData;
