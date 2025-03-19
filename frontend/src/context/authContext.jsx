import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`,
          {
            withCredentials: true,
          }
        );
        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (formData) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/login`,
      formData,
      {
        withCredentials: true,
      }
    );
    setUser(response.data.user); 
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(
      `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
      }
      );
      setUser(null); 
    } catch (error) {
      console.error("Chyba při odhlášení:", error.response?.data || error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
