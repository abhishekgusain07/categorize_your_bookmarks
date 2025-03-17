'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../../lib/constant';

export default function FetchPage() {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<null | 'success' | 'error'>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [fetchedCount, setFetchedCount] = useState(0);

  // Reset status after 3 seconds
  useEffect(() => {
    if (fetchStatus) {
      const timer = setTimeout(() => {
        setFetchStatus(null);
        setStatusMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fetchStatus]);

  const handleFetch = async () => {
    if (isFetching) return;
    
    setIsFetching(true);
    setFetchStatus(null);
    
    try {
      const response = await fetch(`/api/fetch`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setFetchStatus('success');
        setStatusMessage(data.message || 'Tweets fetched successfully!');
        setFetchedCount(data.count || 0);
      } else {
        setFetchStatus('error');
        setStatusMessage(data.error || 'Failed to fetch tweets');
      }
    } catch (error) {
      setFetchStatus('error');
      setStatusMessage('Network error. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-3">
            Fetch Tweets
          </h1>
          <p className="text-gray-400">
            Click the button below to fetch new tweets and process them
          </p>
        </header>
        
        <div className="relative flex flex-col items-center">
          {/* Main pulsating button */}
          <div className="relative mb-12">
            {/* Outer pulse effect */}
            <AnimatePresence>
              {!isFetching && (
                <>
                  <motion.div
                    className="absolute rounded-full bg-blue-500/10"
                    initial={{ width: '100%', height: '100%', opacity: 0 }}
                    animate={{ 
                      width: '150%', 
                      height: '150%', 
                      opacity: [0, 0.2, 0],
                      x: '-25%',
                      y: '-25%'
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2.5,
                      ease: "easeInOut" 
                    }}
                    style={{ top: 0, left: 0 }}
                  />
                  <motion.div
                    className="absolute rounded-full bg-blue-500/10"
                    initial={{ width: '100%', height: '100%', opacity: 0 }}
                    animate={{ 
                      width: '130%', 
                      height: '130%', 
                      opacity: [0, 0.3, 0],
                      x: '-15%',
                      y: '-15%'
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      delay: 0.5,
                      ease: "easeInOut" 
                    }}
                    style={{ top: 0, left: 0 }}
                  />
                </>
              )}
            </AnimatePresence>
            
            {/* Main button */}
            <motion.button
              onClick={handleFetch}
              disabled={isFetching}
              className="relative z-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 text-white font-bold text-lg shadow-lg flex items-center justify-center cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
              
              {isFetching ? (
                <div className="relative flex flex-col items-center">
                  <motion.div 
                    className="w-10 h-10 border-4 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                  <p className="mt-2 text-sm opacity-80">Fetching...</p>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-10 h-10 mb-2"
                  >
                    <path d="M11.9997 2C6.47976 2 2.00049 6.48 2.00049 12C2.00049 17.52 6.47976 22 11.9997 22C17.5197 22 21.9997 17.52 21.9997 12C21.9997 6.48 17.5197 2 11.9997 2ZM18.9197 8H15.9697C15.6497 6.75 15.1997 5.55 14.6297 4.44C16.4397 5.07 17.9197 6.35 18.9197 8ZM11.9997 4.04C12.8297 5.24 13.4797 6.57 13.9097 8H10.0897C10.5197 6.57 11.1697 5.24 11.9997 4.04ZM4.25976 14C4.09976 13.36 3.99976 12.69 3.99976 12C3.99976 11.31 4.09976 10.64 4.25976 10H7.63976C7.55976 10.66 7.49976 11.32 7.49976 12C7.49976 12.68 7.55976 13.34 7.63976 14H4.25976ZM5.07976 16H8.02976C8.34976 17.25 8.79976 18.45 9.36976 19.56C7.55976 18.93 6.07976 17.66 5.07976 16ZM8.02976 8H5.07976C6.07976 6.34 7.55976 5.07 9.36976 4.44C8.79976 5.55 8.34976 6.75 8.02976 8ZM11.9997 19.96C11.1697 18.76 10.5197 17.43 10.0897 16H13.9097C13.4797 17.43 12.8297 18.76 11.9997 19.96ZM14.3397 14H9.65976C9.55976 13.34 9.49976 12.68 9.49976 12C9.49976 11.32 9.55976 10.65 9.65976 10H14.3397C14.4397 10.65 14.4997 11.32 14.4997 12C14.4997 12.68 14.4397 13.34 14.3397 14ZM14.6297 19.56C15.1997 18.45 15.6497 17.25 15.9697 16H18.9197C17.9197 17.65 16.4397 18.93 14.6297 19.56ZM16.3597 14C16.4397 13.34 16.4997 12.68 16.4997 12C16.4997 11.32 16.4397 10.66 16.3597 10H19.7397C19.8997 10.64 19.9997 11.31 19.9997 12C19.9997 12.69 19.8997 13.36 19.7397 14H16.3597Z" />
                  </svg>
                  <span>Fetch</span>
                </div>
              )}
            </motion.button>
          </div>
          
          {/* Status message */}
          <AnimatePresence>
            {fetchStatus && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`mb-8 px-6 py-3 rounded-lg text-center ${
                  fetchStatus === 'success' 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                <p>{statusMessage}</p>
                {fetchStatus === 'success' && fetchedCount > 0 && (
                  <p className="text-sm mt-1">
                    {fetchedCount} {fetchedCount === 1 ? 'tweet' : 'tweets'} processed
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Back to dashboard link */}
          <motion.a
            href="/stock"
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42a.996.996 0 0 0-1.41 0l-6.59 6.59a.996.996 0 0 0 0 1.41l6.59 6.59a.996.996 0 1 0 1.41-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"/>
            </svg>
            Back to Tweet Stock
          </motion.a>
        </div>
      </div>
    </div>
  );
}
