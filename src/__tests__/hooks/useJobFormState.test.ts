import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useJobFormState from '../../hooks/useJobFormState';

describe('useJobFormState', () => {
  const initialState = {
    title: '',
    description: '',
    category: '',
    jobType: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    companyName: '',
    contactName: '',
    contactEmail: '',
    companyWebsite: '',
    contactPhone: '',
  };

  it('should initialize with the provided initial state', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    expect(result.current.values).toEqual(initialState);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update values when handleChange is called', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    act(() => {
      result.current.handleChange('title', 'Software Developer');
    });

    expect(result.current.values.title).toBe('Software Developer');
  });

  it('should mark field as touched when handleBlur is called', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    act(() => {
      result.current.handleBlur('title');
    });

    expect(result.current.touched.title).toBe(true);
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    // Mark field as touched
    act(() => {
      result.current.handleBlur('title');
    });

    // Validate the field (which is empty)
    act(() => {
      result.current.validate.validate('title', '');
    });

    expect(result.current.errors.title).toBe('Job title is required');
  });

  it('should validate email format', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    // Mark field as touched
    act(() => {
      result.current.handleBlur('contactEmail');
    });

    // Validate with invalid email
    act(() => {
      result.current.validate.validate('contactEmail', 'invalid-email');
    });

    expect(result.current.errors.contactEmail).toBe('Invalid email address');

    // Validate with valid email
    act(() => {
      result.current.validate.validate('contactEmail', 'valid@example.com');
    });

    expect(result.current.errors.contactEmail).toBeUndefined();
  });

  it('should validate URL format', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    // Mark field as touched
    act(() => {
      result.current.handleBlur('companyWebsite');
    });

    // Validate with invalid URL
    act(() => {
      result.current.validate.validate('companyWebsite', 'invalid-url');
    });

    expect(result.current.errors.companyWebsite).toBe('Invalid URL format');

    // Validate with valid URL
    act(() => {
      result.current.validate.validate('companyWebsite', 'https://example.com');
    });

    expect(result.current.errors.companyWebsite).toBeUndefined();
  });

  it('should validate phone number format', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    // Mark field as touched
    act(() => {
      result.current.handleBlur('contactPhone');
    });

    // Validate with invalid phone
    act(() => {
      result.current.validate.validate('contactPhone', 'abc');
    });

    expect(result.current.errors.contactPhone).toBe('Invalid phone number');

    // Validate with valid phone
    act(() => {
      result.current.validate.validate('contactPhone', '+27 123 456 7890');
    });

    expect(result.current.errors.contactPhone).toBeUndefined();
  });

  it('should validate all fields when validateAll is called', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    let isValid;
    act(() => {
      isValid = result.current.validateAll();
    });

    // Should fail validation since required fields are empty
    expect(isValid).toBe(false);
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

    // Fill in required fields
    act(() => {
      result.current.setValues({
        ...initialState,
        title: 'Software Developer',
        description: 'Job description',
        category: 'Technology',
        jobType: 'Full-time',
        location: 'Cape Town',
        companyName: 'Acme Inc',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
      });
    });

    act(() => {
      isValid = result.current.validateAll();
    });

    // Should pass validation now
    expect(isValid).toBe(true);
  });

  it('should reset form state when reset is called', () => {
    const { result } = renderHook(() => useJobFormState(initialState));

    // Change some values
    act(() => {
      result.current.handleChange('title', 'Software Developer');
      result.current.handleBlur('title');
      result.current.setIsSubmitting(true);
    });

    // Reset the form
    act(() => {
      result.current.reset();
    });

    // Should be back to initial state
    expect(result.current.values).toEqual(initialState);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });
});
