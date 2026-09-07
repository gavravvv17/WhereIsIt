import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await client.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Token verification failed", err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await client.post('/auth/login', { email, password });
      const { token, userId, name } = res.data;
      
      localStorage.setItem('token', token);
      const userData = { id: userId, name, email };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: typeof err.response?.data === 'string' ? err.response.data : 'Invalid email or password'
      };
    }
  };

  const initiateRegister = async (name, email, password, confirmPassword) => {
    try {
      const res = await client.post('/auth/register/init', { name, email, password, confirmPassword });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        error: typeof err.response?.data === 'string' ? err.response.data : 'Registration initiation failed'
      };
    }
  };

  const verifyRegister = async (email, otp) => {
    try {
      const res = await client.post('/auth/register/verify', { email, otp });
      const { token, userId, name } = res.data;
      
      localStorage.setItem('token', token);
      const userData = { id: userId, name, email };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: typeof err.response?.data === 'string' ? err.response.data : 'OTP verification failed'
      };
    }
  };

  const resendOtp = async (email, type) => {
    try {
      const res = await client.post('/auth/resend-otp', { email, type });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        error: typeof err.response?.data === 'string' ? err.response.data : 'Failed to resend OTP'
      };
    }
  };

  const initiateForgotPassword = async (email) => {
    try {
      const res = await client.post('/auth/forgot-password/init', { email });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        error: typeof err.response?.data === 'string' ? err.response.data : 'Failed to send reset code'
      };
    }
  };

  const verifyForgotPassword = async (email, otp) => {
    try {
      const res = await client.post('/auth/forgot-password/verify', { email, otp });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        error: typeof err.response?.data === 'string' ? err.response.data : 'Invalid reset OTP'
      };
    }
  };

  const resetForgotPassword = async (email, otp, newPassword, confirmPassword) => {
    try {
      const res = await client.post('/auth/forgot-password/reset', { email, otp, newPassword, confirmPassword });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        error: typeof err.response?.data === 'string' ? err.response.data : 'Password reset failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      initiateRegister,
      verifyRegister,
      resendOtp,
      initiateForgotPassword,
      verifyForgotPassword,
      resetForgotPassword,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
