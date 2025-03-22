'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface PreviewTweet {
  id: string;
  text: string;
  author: string;
  created_at: string;
  url: string;
}

export default function FetchPage() {
  const [isFetching, setIsFetching] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [fetchStatus, setFetchStatus] = useState<null | 'success' | 'error'>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [fetchedCount, setFetchedCount] = useState(0);
  const [previewTweets, setPreviewTweets] = useState<PreviewTweet[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [newTweetsData, setNewTweetsData] = useState<{
    hasNewTweets: boolean;
    estimatedNewTweets: number;
    totalProcessed: number;
  } | null>(null);

  // Check for new tweets on page load
  useEffect(() => {
    checkForNewTweets();
  }, []);

  // Function to load preview tweets
  const loadPreviewTweets = async () => {
    try {
      setIsPreviewLoading(true);
      const response = await fetch('/api/previewTweets');
      if (response.ok) {
        const data = await response.json();
        setPreviewTweets(data.tweets);
      }
    } catch (error) {
      console.error('Error loading preview tweets:', error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Load preview tweets when new tweets are found
  useEffect(() => {
    if (newTweetsData?.hasNewTweets) {
      loadPreviewTweets();
    }
  }, [newTweetsData?.hasNewTweets]);

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
        
        // Store the fetch timestamp and count in localStorage for highlighting
        const fetchInfo = {
          timestamp: new Date().toISOString(),
          count: data.count || 0,
          categories: data.categories || []
        };
        localStorage.setItem('lastFetch', JSON.stringify(fetchInfo));
        
        // Redirect to stock page after showing success message
        setTimeout(() => {
          // If we have category info, redirect to that specific category
          if (data.categories && data.categories.length > 0) {
            // Use the most frequent category if multiple were processed
            const categoryToRedirectTo = data.categories[0];
            // Ensure category is properly encoded in the URL
            const encodedCategory = encodeURIComponent(categoryToRedirectTo);
            window.location.href = `/stock?highlight=new&category=${encodedCategory}`;
          } else {
            window.location.href = '/stock?highlight=new';
          }
        }, 1500); // Wait 1.5s to show the success message before redirecting
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

  // Preview Tweet Card Component
  const PreviewTweetCard = ({ tweet }: { tweet: PreviewTweet }) => (
    <motion.a
      href={tweet.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="block bg-background/50 dark:bg-background/30 backdrop-blur-md border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:bg-background/70 dark:hover:bg-background/40 hover:border-primary/50"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-6 h-6 text-primary"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground">@{tweet.author}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {new Date(tweet.created_at).toLocaleDateString()}
              </p>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-4 h-4 text-muted-foreground"
              >
                <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"/>
              </svg>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">{tweet.text}</p>
        </div>
      </div>
    </motion.a>
  );

  // Loading state
  if (isChecking && !newTweetsData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative w-20 h-20">
            {/* Animated rings */}
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-primary/30"
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
              className="absolute inset-3 rounded-full border-2 border-secondary/20"
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
                className="absolute h-1.5 w-1.5 rounded-full bg-primary"
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
              className="absolute rounded-full bg-gradient-to-br from-primary to-primary/60"
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
                className="text-foreground"
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
            <p className="text-foreground font-medium">Loading</p>
            <div className="flex items-center justify-center mt-1 space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background/80 pointer-events-none" />
      
      <div className="w-full max-w-lg relative">
        <header className="mb-16 text-center relative">
          <div className="absolute -right-2 -top-2">
            <ThemeToggle />
          </div>
          <motion.h1 
            className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground to-primary"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Fetch Tweets
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Click the button below to fetch new tweets and process them
          </motion.p>
          {newTweetsData && (
            <motion.div 
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-muted-foreground text-base">
                Total processed: <span className="text-primary font-semibold">{newTweetsData.totalProcessed}</span> tweets
              </p>
            </motion.div>
          )}
        </header>
        
        {/* Preview Tweets Section */}
        {newTweetsData?.hasNewTweets && (
          <div className="w-full mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <div className="absolute inset-x-0 -top-6 h-24 bg-gradient-to-b from-background via-background to-transparent" />
              <div className="absolute inset-x-0 -bottom-6 h-24 bg-gradient-to-t from-background via-background to-transparent" />
              
              <div className="relative">
                <h3 className="text-lg font-medium text-foreground mb-4 text-center">
                  Quick Preview
                  <span className="ml-2 text-sm text-muted-foreground">
                    (Latest {previewTweets.length} tweets)
                  </span>
                </h3>
                
                {isPreviewLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      className="w-8 h-8 border-2 border-primary rounded-full border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <AnimatePresence>
                      {previewTweets.map((tweet) => (
                        <PreviewTweetCard key={tweet.id} tweet={tweet} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        
        <div className="relative flex flex-col items-center">
          {/* New tweet status message */}
          <AnimatePresence>
            {!isChecking && newTweetsData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-8 px-8 py-4 rounded-2xl text-center shadow-lg backdrop-blur-sm ${
                  newTweetsData.hasNewTweets
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {newTweetsData.hasNewTweets ? (
                  <div className="flex flex-col">
                    <p className="text-lg font-medium">
                      Found approximately <span className="font-bold">{newTweetsData.estimatedNewTweets}</span> new tweets to process!
                    </p>
                    <button 
                      onClick={() => checkForNewTweets(true)} 
                      className="text-sm text-primary hover:text-primary/80 transition-colors mt-2 font-medium"
                      disabled={isChecking}
                    >
                      Refresh count
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-medium">No new tweets found to process.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main button container */}
          <div className="relative mb-16">
            {/* Outer pulse effect */}
            <AnimatePresence>
              {!isFetching && newTweetsData?.hasNewTweets && (
                <>
                  <motion.div
                    className="absolute rounded-full bg-primary/10 dark:bg-primary/5"
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
                    className="absolute rounded-full bg-primary/15 dark:bg-primary/5"
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
              className={`relative z-10 w-48 h-48 rounded-full text-foreground font-bold text-lg shadow-lg flex items-center justify-center cursor-pointer overflow-hidden transition-transform ${
                newTweetsData?.hasNewTweets && !isChecking
                  ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/70 hover:from-primary hover:via-primary hover:to-primary/80 shadow-primary/20'
                  : 'bg-gradient-to-br from-muted/90 via-muted to-muted/70 dark:from-muted-foreground/30 dark:via-muted-foreground/20 dark:to-muted-foreground/10'
              }`}
              whileHover={newTweetsData?.hasNewTweets ? { scale: 1.05 } : {}}
              whileTap={newTweetsData?.hasNewTweets ? { scale: 0.95 } : {}}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5" />
              
              {isChecking ? (
                <div className="relative flex flex-col items-center">
                  <div className="relative w-14 h-14">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-primary/40"
                      animate={{ scale: [1.2, 1, 1.2] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.div 
                      className="absolute inset-0 rounded-full"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="h-3 w-3 rounded-full bg-foreground absolute -top-1.5 left-1/2 transform -translate-x-1/2"></div>
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-8 h-8 text-foreground"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                  <motion.p 
                    className="mt-4 text-base font-medium"
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
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                      className="absolute inset-2 rounded-full border-2 border-foreground/20"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Animated dots orbiting */}
                    <motion.div 
                      className="absolute h-2.5 w-2.5 rounded-full bg-primary"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ 
                        top: '50%', 
                        left: '50%', 
                        translateX: '-50%', 
                        translateY: '-50%',
                        transformOrigin: '0px -32px'
                      }}
                    />
                    
                    <motion.div 
                      className="absolute h-3 w-3 rounded-full bg-foreground"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      style={{ 
                        top: '50%', 
                        left: '50%', 
                        translateX: '-50%', 
                        translateY: '-50%',
                        transformOrigin: '0px -28px'
                      }}
                    />
                    
                    {/* Central pulsating sphere */}
                    <motion.div 
                      className="absolute rounded-full bg-gradient-to-br from-primary to-primary/60"
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
                        className="w-8 h-8 text-foreground"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.9997 2C6.47976 2 2.00049 6.48 2.00049 12C2.00049 17.52 6.47976 22 11.9997 22C17.5197 22 21.9997 17.52 21.9997 12C21.9997 6.48 17.5197 2 11.9997 2ZM18.9197 8H15.9697C15.6497 6.75 15.1997 5.55 14.6297 4.44C16.4397 5.07 17.9197 6.35 18.9197 8ZM11.9997 4.04C12.8297 5.24 13.4797 6.57 13.9097 8H10.0897C10.5197 6.57 11.1697 5.24 11.9997 4.04Z" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <motion.p 
                      className="text-base font-medium"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Fetching tweets
                    </motion.p>
                    
                    <motion.div 
                      className="flex items-center justify-center mt-2 space-x-1.5"
                      initial="hidden"
                      animate="visible"
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-foreground"
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
                    className="w-12 h-12 mb-3"
                  >
                    <path d="M11.9997 2C6.47976 2 2.00049 6.48 2.00049 12C2.00049 17.52 6.47976 22 11.9997 22C17.5197 22 21.9997 17.52 21.9997 12C21.9997 6.48 17.5197 2 11.9997 2ZM18.9197 8H15.9697C15.6497 6.75 15.1997 5.55 14.6297 4.44C16.4397 5.07 17.9197 6.35 18.9197 8ZM11.9997 4.04C12.8297 5.24 13.4797 6.57 13.9097 8H10.0897C10.5197 6.57 11.1697 5.24 11.9997 4.04Z" />
                  </svg>
                  <span className="text-xl font-medium">Fetch</span>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 0.8, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/30 rounded-full blur-sm" />
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-12 h-12 mb-3 text-muted-foreground/70 dark:text-muted-foreground relative z-10"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </motion.div>
                  <motion.div 
                    className="relative"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/50 to-transparent blur-md" />
                    <span className="text-xl font-medium text-muted-foreground/90 dark:text-muted-foreground relative z-10">
                      No Tweets
                    </span>
                  </motion.div>
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
                className={`mb-10 px-8 py-4 rounded-2xl text-center shadow-lg backdrop-blur-sm ${
                  fetchStatus === 'success' 
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                <p className="text-lg font-medium">{statusMessage}</p>
                {fetchStatus === 'success' && fetchedCount > 0 && (
                  <p className="text-base mt-2">
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
              className="mb-10 px-6 py-3 rounded-xl bg-muted/80 dark:bg-muted-foreground/10 border border-border hover:bg-muted dark:hover:bg-muted-foreground/20 transition-all text-foreground flex items-center gap-3 shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5 text-primary"
              >
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              <span className="font-medium">Check for new tweets</span>
            </motion.button>
          )}
          
          {/* Back to dashboard link */}
          <motion.a
            href="/stock"
            className="text-foreground hover:text-primary transition-colors flex items-center gap-3 font-medium"
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
