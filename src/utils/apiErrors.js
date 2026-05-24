export const getApiErrorMessage = (error) => {
  const data = error?.response?.data;

  if (data) {
    return (
      Object.values(data)[0]?.[0] ||
      data.detail ||
      data.msg ||
      "Something went wrong"
    );
  }

  return "Server error. Please try again.";
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
