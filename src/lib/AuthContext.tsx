'use client';

import { createContext, useContext, useEffect, useState } from 'react';


const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_SECRET_PASSWORD; 

interface AuthContextType {
  isUnlocked: boolean;
  unlock: (password: string) => boolean;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Check local storage on first load
  useEffect(() => {
    const storedAuth = localStorage.getItem('xbookmarks-auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.unlocked && authData.timestamp) {
          // Auto-lock after 24 hours for security
          const expiryTime = new Date(authData.timestamp).getTime() + 24 * 60 * 60 * 1000;
          if (Date.now() < expiryTime) {
            setIsUnlocked(true);
          } else {
            localStorage.removeItem('xbookmarks-auth');
          }
        }
      } catch (e) {
        localStorage.removeItem('xbookmarks-auth');
      }
    }
  }, []);

  const unlock = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      setIsUnlocked(true);
      // Store auth state in localStorage with timestamp
      localStorage.setItem('xbookmarks-auth', JSON.stringify({
        unlocked: true,
        timestamp: new Date().toISOString()
      }));
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsUnlocked(false);
    localStorage.removeItem('xbookmarks-auth');
  };

  return (
    <AuthContext.Provider value={{ isUnlocked, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 