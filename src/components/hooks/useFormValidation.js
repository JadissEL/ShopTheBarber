import { useCallback } from 'react';

/**
 * @typedef {{ field: string; message: string; }} ValidationError
 */

/**
 * Hook for validating form data against Zod schemas.
 * Returns validation errors and a validate function.
 * @param {object} schema - Zod schema (passed to validate at call time)
 * @returns {{ validate: (data: object, schema: import('zod').ZodSchema) => Promise<ValidationError[]>, validateField: (fieldName: string, value: unknown, schema: import('zod').ZodSchema) => Promise<string|null> }}
 */
export function useFormValidation() {
  const validate = useCallback(async (data, schema) => {
    try {
      await schema.parseAsync(data);
      return [];
    } catch (error) {
      if (error.errors) {
        return error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
      }
      return [{ field: 'form', message: 'Validation failed' }];
    }
  }, []);

  const validateField = useCallback(async (fieldName, value, schema) => {
    try {
      await schema.pick({ [fieldName]: true }).parseAsync({ [fieldName]: value });
      return null;
    } catch (error) {
      if (error.errors?.[0]) {
        return error.errors[0].message;
      }
      return 'Invalid value';
    }
  }, []);

  return { validate, validateField };
}

/**
 * Format validation errors into a key-value map for easy lookup.
 * @param {ValidationError[]} errors
 * @returns {Record<string, string>}
 */
export function formatValidationErrors(errors) {
  return errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
}

/**
 * Get error message for a specific field.
 * @param {Record<string, string>} errors
 * @param {string} fieldName
 * @returns {string|undefined}
 */
export function getFieldError(errors, fieldName) {
  return errors[fieldName];
}
