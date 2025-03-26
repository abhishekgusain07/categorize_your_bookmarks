'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

export default function LockScreen() {
  const { unlock } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    let errorTimer: NodeJS.Timeout;
    
    if (error) {
      errorTimer = setTimeout(() => {
        setError(false);
      }, 2300);
    }
    
    return () => {
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [error]);

  const handleUnlock = () => {
    if (unlock(password)) {
      setError(false);
    } else {
      setError(true);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-20 h-20 bg-black rounded-full border-2 border-primary flex items-center justify-center mb-6"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-10 h-10 text-primary"
            >
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </motion.div>

          <motion.h1
            className="text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Tweet Bookmarks
          </motion.h1>
          
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Enter your password to unlock
          </motion.p>
        </div>

        <motion.div
          className={`mb-8 relative ${shakeError ? 'animate-shake' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Password"
              className={`w-full bg-gray-900 border ${
                error ? 'border-rose-600' : 'border-gray-700'
              } rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              autoFocus
            />
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 rounded-md py-2 px-3 bg-rose-500/20 border border-rose-500/30 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-5 h-5 text-rose-400"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>
                    </svg>
                    <p className="text-rose-300 text-sm font-medium">
                      Incorrect password. Please try again.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.button
          onClick={handleUnlock}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-5 h-5"
          >
            <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
          </svg>
          Unlock
        </motion.button>
      </motion.div>
    </div>
  );
} 