import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle token refreshing
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh token itself fails or if it's a public/guest endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/users/refresh-token") &&
      !originalRequest.url.includes("/users/login") &&
      !originalRequest.url.includes("/users/logout") &&
      !originalRequest.url.includes("/users/current-user") &&
      !originalRequest.url.includes("/users/register") &&
      !originalRequest.url.includes("/users/check-email")
    ) {
      originalRequest._retry = true;
      try {
        // Call the refresh token endpoint
        await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or failed -> clear session and log out user
        console.warn("Session expired or user logged out. Token refresh skipped.");
        // Dispatch custom event to let AuthProvider handle logout redirection
        window.dispatchEvent(new Event("auth-session-expired"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
