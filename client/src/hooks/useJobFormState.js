import { useState, useMemo, useCallback } from "react";

const useJobFormState = (initialState) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // As discussed in the review, this useMemo with [errors] can cause
  // validate, handleChange, and handleBlur to change identity frequently.
  // A refactor to make validateField a stable useCallback could optimize.
  const { validate } = useMemo(() => {
    const validateField = (field, value, currentValues) => {
      let newErrors = { ...errors };
      switch (field) {
        case "title":
          if (!value?.trim()) newErrors.title = "Job title is required";
          else if (value.trim().length < 3) newErrors.title = "Job title must be at least 3 characters";
          else delete newErrors.title;
          break;
        case "category":
          if (!value) newErrors.category = "Category is required";
          else delete newErrors.category;
          break;
        case "jobType":
          if (!value) newErrors.jobType = "Job type is required";
          else delete newErrors.jobType;
          break;
        case "location":
          if (!value?.trim() && !currentValues.isRemote) newErrors.location = "Location is required unless remote";
          else delete newErrors.location;
          break;
        case "description":
          if (!value?.trim()) newErrors.description = "Job description is required";
          else if (value.trim().length < 30) newErrors.description = "Description must be at least 30 characters";
          else delete newErrors.description;
          break;
        case "salaryMin":
        case "salaryMax":
          const min = parseFloat(currentValues.salaryMin);
          const max = parseFloat(currentValues.salaryMax);
          delete newErrors.salaryMin;
          delete newErrors.salaryMax;

          if (currentValues.salaryMin && (isNaN(min) || min < 0)) {
            newErrors.salaryMin = "Invalid min salary";
          }
          if (currentValues.salaryMax && (isNaN(max) || max < 0)) {
            newErrors.salaryMax = "Invalid max salary";
          }
          if (!newErrors.salaryMin && !newErrors.salaryMax && currentValues.salaryMin && currentValues.salaryMax && min > max) {
            newErrors.salaryMin = "Min salary cannot exceed max";
            newErrors.salaryMax = "Max salary cannot be less than min";
          }
          break;
        case "companyName":
          if (!value?.trim()) newErrors.companyName = "Company name is required";
          else delete newErrors.companyName;
          break;
        case "contactName":
          if (!value?.trim()) newErrors.contactName = "Contact name is required";
          else delete newErrors.contactName;
          break;
        case "contactEmail":
          if (!value?.trim()) newErrors.contactEmail = "Contact email is required";
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.contactEmail = "Invalid email address";
          else delete newErrors.contactEmail;
          break;
        case "companyWebsite":
          if (value?.trim() && !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value)) newErrors.companyWebsite = "Invalid website URL (e.g., http://example.com)";
          else delete newErrors.companyWebsite;
          break;
        case "contactPhone":
          if (value?.trim() && !/^\+?[0-9\s-()]{7,20}$/.test(value)) newErrors.contactPhone = "Invalid phone number";
          else delete newErrors.contactPhone;
          break;
        default:
          break;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0; // This return value isn't reliably used due to async setErrors
    };
    return { validate: validateField };
  }, [errors]);

  const handleChange = useCallback((field, value) => {
    setValues(prev => {
      const newValues = { ...prev, [field]: value };
      if (touched[field] || field === "salaryMin" || field === "salaryMax") {
        validate(field, value, newValues);
      }
      return newValues;
    });
  }, [touched, validate]);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate(field, values[field], values);
  }, [values, validate]);

  const validateAll = useCallback(() => {
    const requiredFields = ["title", "category", "jobType", "description", "companyName", "contactName", "contactEmail"];
    let allNewErrors = {};
    let allNewTouched = {};

    requiredFields.forEach(field => {
      allNewTouched[field] = true;
      switch (field) {
        case "title": if (!values.title?.trim()) allNewErrors.title = "Job title is required"; break;
        case "category": if (!values.category) allNewErrors.category = "Category is required"; break;
        case "jobType": if (!values.jobType) allNewErrors.jobType = "Job type is required"; break;
        case "description": if (!values.description?.trim()) allNewErrors.description = "Job description is required"; break;
        case "companyName": if (!values.companyName?.trim()) allNewErrors.companyName = "Company name is required"; break;
        case "contactName": if (!values.contactName?.trim()) allNewErrors.contactName = "Contact name is required"; break;
        case "contactEmail":
          if (!values.contactEmail?.trim()) allNewErrors.contactEmail = "Contact email is required";
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) allNewErrors.contactEmail = "Invalid email address";
          break;
        default: break;
      }
    });

    allNewTouched.location = true;
    if (!values.location?.trim() && !values.isRemote) {
      allNewErrors.location = "Location is required unless remote";
    }

    const min = parseFloat(values.salaryMin);
    const max = parseFloat(values.salaryMax);
    if (values.salaryMin && values.salaryMax && !isNaN(min) && !isNaN(max) && min > max) {
      allNewErrors.salaryMin = "Min salary cannot exceed max";
      allNewErrors.salaryMax = "Max salary cannot be less than min";
      allNewTouched.salaryMin = true;
      allNewTouched.salaryMax = true;
    }
    if (values.salaryMin && (isNaN(min) || min < 0)) allNewErrors.salaryMin = "Invalid min salary";
    if (values.salaryMax && (isNaN(max) || max < 0)) allNewErrors.salaryMax = "Invalid max salary";

    if (values.companyWebsite?.trim() && !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(values.companyWebsite)) {
      allNewErrors.companyWebsite = "Invalid website URL (e.g., http://example.com)";
      allNewTouched.companyWebsite = true;
    }
    if (values.contactPhone?.trim() && !/^\+?[0-9\s-()]{7,20}$/.test(values.contactPhone)) {
      allNewErrors.contactPhone = "Invalid phone number";
      allNewTouched.contactPhone = true;
    }

    setErrors(allNewErrors);
    setTouched(allNewTouched);
    return Object.keys(allNewErrors).length === 0;
  }, [values]);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialState]);

  return { values, errors, touched, isSubmitting, setIsSubmitting, handleChange, handleBlur, validateAll, reset, setValues };
};

export default useJobFormState;
