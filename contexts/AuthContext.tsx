import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext as useReactContext } from 'react';
import { useConfig } from '../hooks'; // Updated import path
import { UserSettings } from '../types'; // Import UserSettings if not already

const AUTH_STORAGE_KEY = 'attackSimulatorAuth';

export interface AuthContextValue {
  isAuthenticated: boolean;
  login: (usernameInput?: string, passwordInput?: string) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { userSettings } = useConfig(); // Correctly destructure userSettings
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });

  const login = useCallback((usernameInput?: string, passwordInput?: string): boolean => {
    // Ensure userSettings is loaded before trying to access credentials
    if (!userSettings) {
        console.warn("Auth attempt while userSettings not yet loaded.");
        return false; 
    }

    const configuredUsername = userSettings.credentials.username;
    const configuredPassword = userSettings.credentials.password;

    let success = false;
    // Scenario 1: Password is set in config and matches
    if (configuredPassword && usernameInput === configuredUsername && passwordInput === configuredPassword) {
      success = true;
    } 
    // Scenario 2: Password is NOT set in config (empty or undefined), and username matches
    else if (!configuredPassword && usernameInput === configuredUsername) {
      // Allow login if no password is configured and username matches
      success = true;
    }

    if (success) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsAuthenticated(true);
    }
    return success;
  }, [userSettings]); 

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }, []); 

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        setIsAuthenticated(sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); 

  const value = { isAuthenticated, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};