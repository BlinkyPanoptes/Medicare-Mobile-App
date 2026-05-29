import axios from "axios";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://10.0.2.2:8000/api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("userToken");
        const storedUser = await SecureStore.getItemAsync("userData");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load auth data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadContext();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      await SecureStore.setItemAsync("userToken", newToken);
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
