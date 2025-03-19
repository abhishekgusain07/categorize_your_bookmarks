'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FetchPage() {
  const [isFetching, setIsFetching] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [fetchStatus, setFetchStatus] = useState<null | 'success' | 'error'>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [fetchedCount, setFetchedCount] = useState(0);
  const [newTweetsData, setNewTweetsData] = useState<{
    hasNewTweets: boolean;
    estimatedNewTweets: number;
    totalProcessed: number;
  } | null>(null);

  // Check for new tweets on page load
  useEffect(() => {
    checkForNewTweets();
  }, []);

  // Reset status after 3 seconds
  useEffect(() => {
    if (fetchStatus) {
      const timer = setTimeout(() => {
        setFetchStatus(null);
        setStatusMessage('');
        // Check for new tweets again after fetching
        checkForNewTweets();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fetchStatus]);

  // Function to check for new tweets
  const checkForNewTweets = async (force = false) => {
    try {
      setIsChecking(true);
      const response = await fetch(`/api/checkNewTweets${force ? '?force=true' : ''}`);
      
      if (response.ok) {
        const data = await response.json();
        setNewTweetsData({
          hasNewTweets: data.hasNewTweets,
          estimatedNewTweets: data.estimatedNewTweets,
          totalProcessed: data.totalProcessed
        });
      } else {
        console.error('Failed to check for new tweets');
        // If we can't check, assume there are new tweets
        setNewTweetsData({
          hasNewTweets: true,
          estimatedNewTweets: 0,
          totalProcessed: 0
        });
      }
    } catch (error) {
      console.error('Error checking for new tweets:', error);
      // If we can't check, assume there are new tweets
      setNewTweetsData({
        hasNewTweets: true,
        estimatedNewTweets: 0,
        totalProcessed: 0
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleFetch = async () => {
    if (isFetching || !newTweetsData?.hasNewTweets) return;
    
    setIsFetching(true);
    setFetchStatus(null);
    
    try {
      const response = await fetch('/api/fetch', {
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

  // Loading state
  if (isChecking && !newTweetsData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative w-20 h-20">
            {/* Animated rings */}
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-fuchsia-500/30"
              animate={{ 
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />
            
            <motion.div 
              className="absolute inset-3 rounded-full border-2 border-emerald-500/20"
              animate={{ 
                rotate: -360,
                scale: [1.05, 1, 1.05],
              }}
              transition={{ 
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
              }}
            />
            
            {/* Animated particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-fuchsia-400"
                initial={{ 
                  x: 0, 
                  y: 0,
                  opacity: 0,
                }}
                animate={{ 
                  x: [0, Math.cos(i * Math.PI * 2 / 5) * 40],
                  y: [0, Math.sin(i * Math.PI * 2 / 5) * 40],
                  opacity: [0, 0.8, 0],
                  scale: [0.2, 1, 0.2],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
                style={{
                  top: '50%', 
                  left: '50%', 
                  translateX: '-50%', 
                  translateY: '-50%',
                }}
              />
            ))}
            
            {/* Pulsating center */}
            <motion.div
              className="absolute rounded-full bg-gradient-to-br from-fuchsia-600 to-fuchsia-900"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ 
                width: '40%', 
                height: '40%', 
                top: '30%', 
                left: '30%',
              }}
            />
            
            {/* Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-white"
                animate={{ 
                  scale: [0.8, 1, 0.8],
                  rotate: [0, 10, 0, -10, 0],
                }}
                transition={{ 
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-6 h-6"
                >
                  <path d="M11.9997 2C6.47976 2 2.00049 6.48 2.00049 12C2.00049 17.52 6.47976 22 11.9997 22C17.5197 22 21.9997 17.52 21.9997 12C21.9997 6.48 17.5197 2 11.9997 2ZM18.9197 8H15.9697C15.6497 6.75 15.1997 5.55 14.6297 4.44C16.4397 5.07 17.9197 6.35 18.9197 8ZM11.9997 4.04C12.8297 5.24 13.4797 6.57 13.9097 8H10.0897C10.5197 6.57 11.1697 5.24 11.9997 4.04Z" />
                </svg>
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            className="mt-5 text-center"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <p className="text-white font-medium">Loading</p>
            <div className="flex items-center justify-center mt-1 space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-3">
            Fetch Tweets
          </h1>
          <p className="text-gray-500">
            Click the button below to fetch new tweets and process them
          </p>
          {newTweetsData && (
            <div className="mt-4 text-sm">
              <p className="text-gray-400">
                Total processed: <span className="text-white font-semibold">{newTweetsData.totalProcessed}</span> tweets
              </p>
            </div>
          )}
        </header>
        
        <div className="relative flex flex-col items-center">
          {/* Loading state at the top of the page */}
          {!newTweetsData && isChecking && (
            <motion.div 
              className="mb-8 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-center items-center">
                <div className="relative">
                  {/* Multiple rotating gradient rings */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute rounded-full border-2 border-t-transparent border-b-transparent ${
                        i === 0 ? 'border-l-fuchsia-500 border-r-emerald-500' :
                        i === 1 ? 'border-l-emerald-500 border-r-fuchsia-500' :
                        'border-l-fuchsia-300 border-r-emerald-300'
                      }`}
                      style={{
                        width: `${70 - i * 16}px`,
                        height: `${70 - i * 16}px`,
                        top: `${i * 8}px`,
                        left: `${i * 8}px`,
                      }}
                      animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                      transition={{ 
                        duration: 3 + i, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    />
                  ))}
                  
                  {/* Pulsating center */}
                  <motion.div
                    className="absolute rounded-full bg-black"
                    style={{
                      width: '30px',
                      height: '30px',
                      top: '20px',
                      left: '20px',
                    }}
                    animate={{ 
                      boxShadow: [
                        '0 0 0 0px rgba(212, 60, 255, 0.2)',
                        '0 0 0 10px rgba(212, 60, 255, 0)',
                      ],
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: "easeOut" 
                    }}
                  />
                  
                  {/* Center icon */}
                  <motion.div
                    className="absolute flex items-center justify-center"
                    style={{
                      width: '30px',
                      height: '30px',
                      top: '20px',
                      left: '20px',
                    }}
                    animate={{ scale: [0.8, 1, 0.8] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-5 h-5 text-white"
                    >
                      <path d="M12 6v6l4 2-1 2-5-3V6z M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                    </svg>
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="mt-3 flex items-center space-x-1 text-gray-400 text-sm"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <p>Initializing</p>
                <motion.div 
                  className="flex space-x-0.5"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-fuchsia-400"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
          
          {/* New tweet status message */}
          <AnimatePresence>
            {!isChecking && newTweetsData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 px-6 py-3 rounded-lg text-center ${
                  newTweetsData.hasNewTweets
                    ? 'bg-emerald-950/40 text-emerald-400'
                    : 'bg-amber-950/40 text-amber-400'
                }`}
              >
                {newTweetsData.hasNewTweets ? (
                  <div className="flex flex-col">
                    <p>
                      Found approximately <span className="font-bold">{newTweetsData.estimatedNewTweets}</span> new tweets to process!
                    </p>
                    <button 
                      onClick={() => checkForNewTweets(true)} 
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 mt-1"
                      disabled={isChecking}
                    >
                      Refresh count
                    </button>
                  </div>
                ) : (
                  <p>No new tweets found to process.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main pulsating button */}
          <div className="relative mb-12">
            {/* Outer pulse effect */}
            <AnimatePresence>
              {!isFetching && newTweetsData?.hasNewTweets && (
                <>
                  <motion.div
                    className="absolute rounded-full bg-fuchsia-500/5"
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
                    className="absolute rounded-full bg-fuchsia-500/5"
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
              disabled={isFetching || isChecking || !newTweetsData?.hasNewTweets}
              className={`relative z-10 w-40 h-40 rounded-full text-white font-bold text-lg shadow-lg flex items-center justify-center cursor-pointer overflow-hidden ${
                newTweetsData?.hasNewTweets && !isChecking
                  ? 'bg-gradient-to-br from-fuchsia-700 to-fuchsia-900 hover:from-fuchsia-600 hover:to-fuchsia-800'
                  : 'bg-gradient-to-br from-gray-800 to-gray-900 cursor-not-allowed'
              }`}
              whileHover={newTweetsData?.hasNewTweets ? { scale: 1.05 } : {}}
              whileTap={newTweetsData?.hasNewTweets ? { scale: 0.95 } : {}}
            >
              <div className="absolute inset-0 bg-black/20" />
              
              {isChecking ? (
                <div className="relative flex flex-col items-center">
                  <div className="relative w-12 h-12">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-fuchsia-500/20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-fuchsia-400/40"
                      animate={{ scale: [1.2, 1, 1.2] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.div 
                      className="absolute inset-0 rounded-full"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="h-3 w-3 rounded-full bg-white absolute -top-1.5 left-1/2 transform -translate-x-1/2"></div>
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-7 h-7 text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                  <motion.p 
                    className="mt-3 text-sm text-gray-300"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Checking for tweets...
                  </motion.p>
                </div>
              ) : isFetching ? (
                <div className="relative flex flex-col items-center">
                  <div className="relative w-16 h-16">
                    {/* Orbital rings */}
                    <motion.div 
                      className="absolute inset-0 rounded-full border border-fuchsia-500/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                      className="absolute inset-1 rounded-full border border-emerald-500/20"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Animated dots orbiting */}
                    <motion.div 
                      className="absolute h-2 w-2 rounded-full bg-fuchsia-400"
                      animate={{ 
                        rotate: 360
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ 
                        top: '50%', 
                        left: '50%', 
                        translateX: '-50%', 
                        translateY: '-50%',
                        transformOrigin: '0px -28px'
                      }}
                    />
                    
                    <motion.div 
                      className="absolute h-3 w-3 rounded-full bg-emerald-400"
                      animate={{ 
                        rotate: -360
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      style={{ 
                        top: '50%', 
                        left: '50%', 
                        translateX: '-50%', 
                        translateY: '-50%',
                        transformOrigin: '0px -24px'
                      }}
                    />
                    
                    {/* Central pulsating sphere */}
                    <motion.div 
                      className="absolute rounded-full bg-gradient-to-br from-fuchsia-600 to-fuchsia-900"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 0.9, 0.7]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      style={{ 
                        width: '50%', 
                        height: '50%', 
                        top: '25%', 
                        left: '25%'
                      }}
                    />
                    
                    {/* Central icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-7 h-7 text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.9997 2C6.47976 2 2.00049 6.48 2.00049 12C2.00049 17.52 6.47976 22 11.9997 22C17.5197 22 21.9997 17.52 21.9997 12C21.9997 6.48 17.5197 2 11.9997 2ZM18.9197 8H15.9697C15.6497 6.75 15.1997 5.55 14.6297 4.44C16.4397 5.07 17.9197 6.35 18.9197 8ZM11.9997 4.04C12.8297 5.24 13.4797 6.57 13.9097 8H10.0897C10.5197 6.57 11.1697 5.24 11.9997 4.04Z" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <motion.p 
                      className="text-sm text-gray-300"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Fetching tweets
                    </motion.p>
                    
                    <motion.div 
                      className="flex items-center justify-center mt-1 space-x-1"
                      initial="hidden"
                      animate="visible"
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              ) : newTweetsData?.hasNewTweets ? (
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
              ) : (
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 0.8, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-10 h-10 mb-2 opacity-60"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </motion.div>
                  <motion.span 
                    className="opacity-70"
                    animate={{ opacity: [0.7, 0.9, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    No Tweets
                  </motion.span>
                </div>
              )}
            </motion.button>
          </div>
          
          {/* Fetch Status message */}
          <AnimatePresence>
            {fetchStatus && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`mb-8 px-6 py-3 rounded-lg text-center ${
                  fetchStatus === 'success' 
                    ? 'bg-emerald-950/40 text-emerald-400' 
                    : 'bg-rose-950/40 text-rose-400'
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
          
          {/* Refresh button */}
          {!isChecking && !newTweetsData?.hasNewTweets && (
            <motion.button
              onClick={() => checkForNewTweets(true)}
              className="mb-8 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors text-white flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5 text-fuchsia-400"
              >
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Check for new tweets
            </motion.button>
          )}
          
          {/* Back to dashboard link */}
          <motion.a
            href="/stock"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
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
