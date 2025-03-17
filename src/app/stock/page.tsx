'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Define types
type CategoryCount = {
  [key: string]: number;
};

type Tweet = {
  id: string;
  tweet_url: string;
  processedAt: string;
};

type CategoryData = {
  validCategories: string[];
  categoryCounts: CategoryCount;
  totalProcessed: number;
};

export default function StockPage() {
  // State for categories and tweets
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch category data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategoryData(data);
        
        // Select the category with the most tweets by default
        if (data.validCategories && data.validCategories.length > 0) {
          const mostPopularCategory = Object.entries(data.categoryCounts)
            .sort(([, countA], [, countB]) => (countB as number) - (countA as number))[0][0];
          setSelectedCategory(mostPopularCategory);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [refreshing]);

  // Fetch tweets for selected category
  useEffect(() => {
    const fetchTweets = async () => {
      if (!selectedCategory) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/tweets/${selectedCategory}`);
        const data = await response.json();
        setTweets(data.tweets || []);
      } catch (error) {
        console.error(`Error fetching tweets for ${selectedCategory}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  }, [selectedCategory]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/fetch');
      setRefreshing(false);
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

  // Loading state
  if (loading && !categoryData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Tweet Stock
            </h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors ${
                refreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Tweets'}
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            {categoryData?.totalProcessed || 0} tweets organized in {categoryData?.validCategories?.length || 0} categories
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category sidebar */}
          <div className="lg:col-span-1 bg-gray-800 rounded-xl p-4 h-fit sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="space-y-2">
              {categoryData?.validCategories?.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  }`}
                >
                  <span className="capitalize">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs">
                    {categoryData?.categoryCounts[category] || 0}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tweet list */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-6 capitalize">
                {selectedCategory?.replace(/_/g, ' ') || 'Select a category'}
              </h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : tweets.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No tweets found in this category
                </div>
              ) : (
                <div className="space-y-4">
                  {tweets.map((tweet, index) => (
                    <motion.div
                      key={tweet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <a
                            href={tweet.tweet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors break-all"
                          >
                            {tweet.tweet_url}
                          </a>
                        </div>
                        <span className="text-gray-400 text-sm ml-4">
                          {formatDate(tweet.processedAt)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
