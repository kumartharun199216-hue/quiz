import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    const studentToken = localStorage.getItem('studentToken');
    const url = config.url || '';

    // Routes explicitly meant for Student Exam Engine
    const isStudentRoute = url.includes('/attempts') || url.includes('/auth/student');

    if (isStudentRoute) {
      if (studentToken) {
        config.headers.Authorization = `Bearer ${studentToken}`;
      } else {
        delete config.headers.Authorization;
      }
    } else {
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else if (studentToken) {
        config.headers.Authorization = `Bearer ${studentToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;
