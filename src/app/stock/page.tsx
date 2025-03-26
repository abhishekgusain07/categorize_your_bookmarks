'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import ProtectedLayout from '@/components/ProtectedLayout';

// Define types
type CategoryCount = {
  [key: string]: number;
};

type Tweet = {
  id: string;
  tweet_url: string;
  processedAt: string;
  tweet_text?: string;
};

type CategoryData = {
  validCategories: string[];
  categoryCounts: CategoryCount;
  totalProcessed: number;
};

export default function TweetStockPage() {
  // State for categories and tweets
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [newlyFetchedTweets, setNewlyFetchedTweets] = useState<{
    timestamp: string;
    ids: Set<string>;
  }>({ timestamp: '', ids: new Set() });
  
  // Helper function to find a valid category that matches the requested one
  const findMatchingCategory = (requestedCategory: string, validCategories: string[] = []): string | null => {
    if (!requestedCategory) return null;
    
    // First try exact match
    const exactMatch = validCategories.find(cat => cat === requestedCategory);
    if (exactMatch) return exactMatch;
    
    // Then try case-insensitive match
    const lowerRequested = requestedCategory.toLowerCase();
    const caseInsensitiveMatch = validCategories.find(cat => cat.toLowerCase() === lowerRequested);
    if (caseInsensitiveMatch) return caseInsensitiveMatch;
    
    // Finally try matching with underscores replaced by spaces and vice versa
    const withSpaces = requestedCategory.replace(/_/g, ' ').toLowerCase();
    const withUnderscores = requestedCategory.replace(/\s+/g, '_').toLowerCase();
    
    const spaceMatch = validCategories.find(cat => 
      cat.replace(/_/g, ' ').toLowerCase() === withSpaces);
    if (spaceMatch) return spaceMatch;
    
    const underscoreMatch = validCategories.find(cat => 
      cat.replace(/\s+/g, '_').toLowerCase() === withUnderscores);
    if (underscoreMatch) return underscoreMatch;
    
    return null;
  };
  
  // Safe setter for category that ensures we use a valid category
  const setCategory = (category: string | null) => {
    if (!category) {
      setSelectedCategory(null);
      return;
    }
    
    if (categoryData?.validCategories) {
      const matchedCategory = findMatchingCategory(category, categoryData.validCategories);
      console.log(`Setting category: requested=${category}, matched=${matchedCategory}`);
      setSelectedCategory(matchedCategory);
    } else {
      // Store the requested category to be resolved once we load valid categories
      console.log(`Storing category request for later: ${category}`);
      setSelectedCategory(category);
    }
  };

  // Parse query parameters to highlight new tweets and select category
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const highlight = params.get('highlight');
      const categoryParam = params.get('category');
      
      console.log('URL parameters:', { highlight, categoryParam });
      
      // If highlight=new is present, we should highlight new tweets
      if (highlight === 'new') {
        // Get the last fetch info from localStorage
        const lastFetchStr = localStorage.getItem('lastFetch');
        if (lastFetchStr) {
          try {
            const lastFetch = JSON.parse(lastFetchStr);
            // Will mark these as newly fetched with the timestamp
            setNewlyFetchedTweets({
              timestamp: lastFetch.timestamp,
              ids: new Set() // We'll populate this when we fetch the tweets
            });
          } catch (e) {
            console.error('Error parsing lastFetch data:', e);
          }
        }
      }
      
      // If we have a category from the URL, select it regardless of highlight
      if (categoryParam && categoryParam.length > 0) {
        setCategory(categoryParam);
      }
    }
  }, []);

  // Fetch category data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategoryData(data);
        
        // Only re-evaluate category if we have valid categories
        if (data.validCategories && data.validCategories.length > 0) {
          // Re-evaluate the selected category with the loaded valid categories
          if (selectedCategory) {
            // Only need to re-match if we have a possibly unmatched category
            const shouldReMatch = !data.validCategories.includes(selectedCategory);
            if (shouldReMatch) {
              setCategory(selectedCategory);
            }
          } 
          // Select default if no category is selected
          else {
            // Select the category with the most tweets by default
            const mostPopularCategory = Object.entries(data.categoryCounts)
              .sort(([, countA], [, countB]) => (countB as number) - (countA as number))[0][0];
            setCategory(mostPopularCategory);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [refreshing, selectedCategory]);

  // Fetch tweets for selected category
  useEffect(() => {
    const fetchTweets = async () => {
      if (!selectedCategory) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/tweets/${selectedCategory}`);
        const data = await response.json();
        const fetchedTweets = data.tweets || [];
        setTweets(fetchedTweets);
        
        // If we're highlighting new tweets, identify them by comparing timestamps
        if (newlyFetchedTweets.timestamp) {
          const lastFetchTime = new Date(newlyFetchedTweets.timestamp);
          // Find tweets processed around or after the last fetch time
          // Allow a small buffer (5 seconds before) to account for timing differences
          const bufferTime = new Date(lastFetchTime.getTime() - 5000);
          
          const newIds = new Set<string>(
            fetchedTweets
              .filter((tweet: Tweet) => new Date(tweet.processedAt) >= bufferTime)
              .map((tweet: Tweet) => tweet.id)
          );
          
          setNewlyFetchedTweets(prev => ({ 
            timestamp: prev.timestamp, 
            ids: newIds 
          }));
        }
      } catch (error) {
        console.error(`Error fetching tweets for ${selectedCategory}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  }, [selectedCategory, newlyFetchedTweets.timestamp]);

  // Clear highlight after a delay
  useEffect(() => {
    if (newlyFetchedTweets.ids.size > 0) {
      // Remove the highlighting after some time
      const timer = setTimeout(() => {
        // Clear the URL parameter without refreshing the page
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('highlight');
          url.searchParams.delete('category');
          window.history.replaceState({}, '', url.toString());
        }
        
        // Clear the highlight state after 10 seconds
        setTimeout(() => {
          setNewlyFetchedTweets({ timestamp: '', ids: new Set() });
        }, 10000);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [newlyFetchedTweets.ids]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/fetch');
      // Wait a moment to allow processing to complete
      setTimeout(async () => {
        // Refresh category data
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategoryData(data);
        setRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error('Error refreshing tweets:', error);
      setRefreshing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Filter tweets by search query
  const filteredTweets = useMemo(() => {
    if (!searchQuery.trim()) return tweets;
    
    return tweets.filter(tweet => 
      tweet.tweet_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tweet.tweet_text && tweet.tweet_text.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tweets, searchQuery]);

  // Update the mobile menu button click handler to use setCategory
  const handleCategoryClick = (category: string) => {
    setCategory(category);
    setIsMobileMenuOpen(false);
  };

  // Loading state
  if (loading && !categoryData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
              <Link href="/">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                  Tweet Stock
                </h1>
                </Link>
                <p className="text-muted-foreground mt-2">
                  {categoryData?.totalProcessed || 0} tweets organized in {categoryData?.validCategories?.length || 0} categories
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <ThemeToggle />
                
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden px-4 py-2 rounded-lg bg-card-background border border-card-border hover:bg-card-hover transition-colors"
                >
                  {isMobileMenuOpen ? 'Hide Categories' : 'Show Categories'}
                </button>
                <Link
                  href="/fetch"
                  className="px-4 py-2 rounded-lg bg-card-background border border-card-border hover:bg-card-hover transition-colors text-foreground flex items-center gap-2"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-5 h-5 text-primary"
                  >
                    <path d="M11.9997 2C6.47976 2 2.00049 6.48 2.00049 12C2.00049 17.52 6.47976 22 11.9997 22C17.5197 22 21.9997 17.52 21.9997 12C21.9997 6.48 17.5197 2 11.9997 2ZM18.9197 8H15.9697C15.6497 6.75 15.1997 5.55 14.6297 4.44C16.4397 5.07 17.9197 6.35 18.9197 8ZM11.9997 4.04C12.8297 5.24 13.4797 6.57 13.9097 8H10.0897C10.5197 6.57 11.1697 5.24 11.9997 4.04Z" />
                  </svg>
                  <span>Fetch New Tweets</span>
                </Link>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`px-4 py-2 rounded-lg bg-card-background border border-card-border hover:bg-card-hover transition-colors text-foreground ${
                    refreshing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Tweets'}
                </button>
              </div>
            </div>
          </header>

          {/* Mobile category menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mb-6 bg-card-background border border-card-border rounded-xl p-4">
              <h2 className="text-xl font-semibold mb-4">Categories</h2>
              <div className="grid grid-cols-2 gap-2">
                {categoryData?.validCategories?.map((category) => (
                  <motion.button
                    key={category}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick(category)}
                    className={`text-left px-3 py-2 rounded-lg flex justify-between items-center transition-colors ${
                      selectedCategory && selectedCategory.toLowerCase() === category.toLowerCase()
                        ? 'bg-primary/60 text-foreground border border-primary/80'
                        : 'bg-card-hover hover:bg-card-hover/70 text-muted-foreground border border-card-border'
                    }`}
                  >
                    <span className="capitalize text-sm">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className="bg-background/40 text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                      {categoryData?.categoryCounts[category] || 0}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Category sidebar - desktop */}
            <div className="hidden md:block lg:col-span-1 bg-card-background border border-card-border rounded-xl p-4 h-fit sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Categories</h2>
              <div className="space-y-2">
                {categoryData?.validCategories?.map((category) => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick(category)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-colors ${
                      selectedCategory && selectedCategory.toLowerCase() === category.toLowerCase()
                        ? 'bg-primary/60 text-foreground border border-primary/80'
                        : 'bg-card-hover hover:bg-card-hover/70 text-muted-foreground border border-card-border'
                    }`}
                  >
                    <span className="capitalize">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className="bg-background/40 text-muted-foreground px-2 py-1 rounded-full text-xs">
                      {categoryData?.categoryCounts[category] || 0}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tweet list */}
            <div className="lg:col-span-3">
              <div className="bg-card-background border border-card-border rounded-xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-semibold capitalize flex items-center">
                    {selectedCategory?.replace(/_/g, ' ') || 'Select a category'}
                    <span className="ml-3 bg-primary/60 border border-primary/80 text-foreground px-2 py-1 rounded-full text-xs">
                      {filteredTweets.length} tweets
                    </span>
                  </h2>
                  
                  {/* Search input */}
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search tweets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-card-hover border border-card-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : filteredTweets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery 
                      ? 'No tweets match your search query' 
                      : 'No tweets found in this category'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTweets.map((tweet, index) => {
                      const isNewlyFetched = newlyFetchedTweets.ids.has(tweet.id);
                      
                      return (
                        <motion.div
                          key={tweet.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            scale: isNewlyFetched ? [1, 1.03, 1] : 1,
                            boxShadow: isNewlyFetched 
                              ? ['0 0 0 rgba(217, 70, 239, 0)', '0 0 20px rgba(217, 70, 239, 0.5)', '0 0 10px rgba(217, 70, 239, 0.2)'] 
                              : 'none'
                          }}
                          transition={{ 
                            delay: index * 0.05,
                            scale: {
                              repeat: isNewlyFetched ? 2 : 0,
                              duration: 1.5,
                            },
                            boxShadow: {
                              repeat: isNewlyFetched ? 2 : 0,
                              duration: 1.5,
                            }
                          }}
                          className={`bg-card-hover border ${
                            isNewlyFetched
                              ? 'border-primary/70'
                              : 'border-card-border'
                          } rounded-lg p-4 hover:bg-card-hover/80 transition-colors relative overflow-hidden`}
                        >
                          {isNewlyFetched && (
                            <motion.div
                              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"
                              initial={{ scaleX: 0, transformOrigin: "left" }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                            />
                          )}
                          
                          {isNewlyFetched && (
                            <motion.div
                              className="absolute -right-1 -top-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-md rounded-tr-md font-semibold shadow-lg"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 + 0.3 }}
                            >
                              NEW
                            </motion.div>
                          )}
                          
                          <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                            <div className="flex-1">
                              {tweet.tweet_text && (
                                <p className="text-foreground mb-2 line-clamp-3">
                                  {tweet.tweet_text}
                                </p>
                              )}
                              <a
                                href={tweet.tweet_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors break-all"
                              >
                                {tweet.tweet_url}
                              </a>
                            </div>
                            <span className="text-muted-foreground text-sm md:ml-4 md:whitespace-nowrap">
                              {formatDate(tweet.processedAt)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
