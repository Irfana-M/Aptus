// hooks/useZodForm.ts
import { useState, useCallback } from 'react';
import { z } from 'zod';

export const useZodForm = <T extends Record<string, any>>(
  schema: z.ZodSchema<any>,
  initialValues: T
) => {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  
  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  const setFieldTouched = useCallback(<K extends keyof T>(field: K) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);
  
  const validateForm = useCallback(() => {
    try {
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.issues.forEach(err => {
          if (err.path[0]) {
            const fieldName = err.path[0] as keyof T;
            newErrors[fieldName] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData, schema]);
  
  const resetForm = useCallback((newValues: T = initialValues) => {
    setFormData(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);
  
  const isFormValid = Object.keys(errors).length === 0;
  
  return {
    formData,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateForm,
    isFormValid,
    resetForm
  };
};