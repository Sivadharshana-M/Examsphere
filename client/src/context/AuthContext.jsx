import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('examsphere_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('examsphere_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getProfile();
          setUser(res.data.user);
          localStorage.setItem('examsphere_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.warn('[AuthContext] Profile verification failed, logging out');
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password, portalRole) => {
    const res = await authAPI.login({ email, password, portalRole });
    const { token: jwtToken, user: userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('examsphere_token', jwtToken);
    localStorage.setItem('examsphere_user', JSON.stringify(userData));
    return userData;
  };

  const registerAdmin = async (name, email, password) => {
    const res = await authAPI.registerAdmin({ name, email, password });
    const { token: jwtToken, user: userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('examsphere_token', jwtToken);
    localStorage.setItem('examsphere_user', JSON.stringify(userData));
    return userData;
  };

  const updateProfile = async (profileData) => {
    const res = await authAPI.updateProfile(profileData);
    const updatedUser = res.data.user;
    setUser(updatedUser);
    localStorage.setItem('examsphere_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const changePassword = async (passwordData) => {
    return await authAPI.changePassword(passwordData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('examsphere_token');
    localStorage.removeItem('examsphere_user');
  };

  const role = user?.role ? user.role.toLowerCase() : '';

  const isCollegeAdmin = role === 'college_admin';
  const isTeacher = role === 'teacher';
  const isInvigilator = role === 'invigilator';
  const isStudent = role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerAdmin,
        updateProfile,
        changePassword,
        logout,
        isCollegeAdmin,
        isTeacher,
        isInvigilator,
        isStudent,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
