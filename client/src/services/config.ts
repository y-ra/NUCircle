import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Function to handle successful responses
 */
const handleRes = (res: AxiosResponse) => res;

const api = axios.create({ withCredentials: true });

/**
 * Add a request interceptor to the Axios instance.
 * Add token to headers if it exists.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Add a response interceptor to the Axios instance.
 * Handle successful responses and 401/403 errors.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return handleRes(response);
  },
  (error: AxiosError) => {
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export default api;
