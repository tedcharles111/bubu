import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, User } from '../db';
import { useNotification } from '../components/Notification';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const loadUserFromLocalStorage = useCallback(async () => {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      try {
        const storedUser = await db.users.get(Number(userId));
        if (storedUser) {
          setUser(storedUser);
        } else {
          localStorage.removeItem('currentUserId');
        }
      } catch (error) {
        console.error('Failed to load user from DB:', error);
        localStorage.removeItem('currentUserId');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromLocalStorage();
  }, [loadUserFromLocalStorage]);

  // Simple password hashing simulation (DO NOT USE IN PRODUCTION)
  const hashPassword = (password: string) => btoa(password); // Base64 encode as a "hash"

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const hashedPassword = hashPassword(password);
      const foundUser = await db.users.where('username').equalsIgnoreCase(username).first();

      if (foundUser && foundUser.passwordHash === hashedPassword) {
        setUser(foundUser);
        localStorage.setItem('currentUserId', foundUser.id!.toString());
        addNotification(`Welcome back, ${foundUser.username}!`, 'success');
        return true;
      } else {
        addNotification('Invalid username or password.', 'error');
        return false;
      }
    } catch (error) {
      addNotification('Login failed. Please try again.', 'error');
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const existingUser = await db.users.where('username').equalsIgnoreCase(username).first();
      if (existingUser) {
        addNotification('Username already exists.', 'error');
        return false;
      }

      const hashedPassword = hashPassword(password);
      const newUserId = await db.users.add({
        username,
        passwordHash: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`, // Dynamic avatar
        wins: 0,
        losses: 0,
      });

      const newUser = await db.users.get(newUserId);
      if (newUser) {
        setUser(newUser);
        localStorage.setItem('currentUserId', newUser.id!.toString());
        addNotification(`Account created for ${newUser.username}!`, 'success');
        return true;
      }
      return false;
    } catch (error) {
      addNotification('Registration failed. Please try again.', 'error');
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUserId');
    addNotification('Logged out successfully.', 'info');
  };

  const authContextValue = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.</Provider>
  );
};