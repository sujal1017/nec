export const getApiErrorMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return "Server error. Please try again.";

  const values = Object.values(data);
  if (values.length > 0) {
    const first = values[0];
    if (Array.isArray(first) && first.length > 0) {
      return first[0];
    }
    if (typeof first === "string") {
      return first;
    }
  }

  return data.detail || data.msg || "Something went wrong";
};

export const getApiFieldErrors = (error, fieldMap = {}) => {
  const data = error?.response?.data;
  if (!data || typeof data !== "object") return {};

  return Object.entries(data).reduce((errors, [field, value]) => {
    const mappedField = fieldMap[field] || field;
    const message = Array.isArray(value) ? value[0] : value;

    if (typeof message === "string") {
      errors[mappedField] = message;
    }

    return errors;
  }, {});
};
