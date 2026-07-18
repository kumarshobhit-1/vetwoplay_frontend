import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get("/users/current-user");
      if (response.data?.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    // Listen for session expiry from API interceptor
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, []);

  const login = async (identity, password) => {
    setLoading(true);
    try {
      const payload = identity.includes("@")
        ? { email: identity, password }
        : { username: identity, password };

      const response = await apiClient.post("/users/login", payload);
      if (response.data?.success) {
        setUser(response.data.data.user);
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data?.message || "Login failed" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Incorrect credentials",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post("/users/logout");
    } catch (error) {
      console.error("Logout API call error:", error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
