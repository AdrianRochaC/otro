// utils/api.js
export const BACKEND_URL = "http://localhost:3001";

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  return response;
};
