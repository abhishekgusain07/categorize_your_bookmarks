import { NextRequest, NextResponse } from 'next/server';
import { Tweet, UserService } from 'rettiwt-api';
// import { openai } from '@ai-sdk/openai';
// import { generateText } from 'ai';
import { Rettiwt } from 'rettiwt-api';
import axios from 'axios';
import { db } from '@/db/drizzle';
import { processedTweets, tweetCategoryEnum } from '@/db/schema';
import { count, eq, sql } from 'drizzle-orm';

// Add this to your code before any other database operations
async function ensureTablesExist() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS processed_tweets (
        id TEXT PRIMARY KEY,
        processed_at TIMESTAMP DEFAULT NOW(),
        tweet_url TEXT,
        category TEXT
      );
    `);
    console.log("Ensured processed_tweets table exists");
  } catch (error) {
    console.error("Error creating table:", error);
  }
}

// Define the type for category counts
type CategoryCounts = {
  [key in typeof tweetCategoryEnum.enumValues[number]]?: number;
};

// Function to get category counts from the database
async function getCategoryCounts(): Promise<CategoryCounts> {
  try {
    // Get all valid categories
    const categories = tweetCategoryEnum.enumValues;
    const categoryCounts: CategoryCounts = {};

    // Initialize all categories with 0 count
    for (const category of categories) {
      categoryCounts[category] = 0;
    }

    // Query the database for counts of each category
    const results = await db
      .select({
        category: processedTweets.category,
        count: count(),
      })
      .from(processedTweets)
      .groupBy(processedTweets.category);

    // Update counts from query results
    for (const result of results) {
      if (result.category) {
        categoryCounts[result.category] = Number(result.count);
      }
    }

    return categoryCounts;
  } catch (error) {
    console.error("Error getting category counts:", error);
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure the table exists before using it
    await ensureTablesExist();
    
    const rettiwt = new Rettiwt({ apiKey: process.env.TWITTER_KEY });

    const fetchTodaysTweets = async () => {
      const allTweets = [];
      let cursor;
      const count = 10; // Increased count to reduce API calls
      const seenTweetIds = new Set(); // Track unique tweets in this session
    
      // Get today's date at 12:01 AM
      const today = new Date();
      today.setHours(0, 1, 0, 0);
      
      // Get tomorrow's date at 12:01 AM for end date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
    
      // First, get all processed tweet IDs from the database
      const existingProcessedTweets = await db
        .select({ id: processedTweets.id })
        .from(processedTweets);
      
      // Create a set of already processed tweet IDs for quick lookup
      const processedTweetIds = new Set(existingProcessedTweets.map(tweet => tweet.id));
      console.log(`Found ${processedTweetIds.size} already processed tweets`);
    
      do {
        try {
          const response = await rettiwt.user.bookmarks(
            count,
            cursor
          );
    
          // Check if response is valid and has tweets
          if (response?.list?.length === 0) {
            break; // Exit if no more tweets
          }
    
          // Process new tweets and avoid duplicates
          if (response?.list) {
            for (const tweet of response.list) {
              // Skip if we've already processed this tweet before
              if (!seenTweetIds.has(tweet.id) && !processedTweetIds.has(tweet.id)) {
                seenTweetIds.add(tweet.id);
                
                // Generate tweet URL
                const tweetUrl = `https://x.com/${tweet.tweetBy?.userName || 'user'}/status/${tweet.id}`;
                
                // Add tweet with URL to the list
                allTweets.push({
                  ...tweet,
                  tweet_url: tweetUrl
                });
                
                // Send tweet for auto-categorization in the background
                try {
                  fetch('http:localhost:3000/api/processTweet', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      tweetId: tweet.id,
                      tweet_url: tweetUrl,
                      tweet_data: tweet, // Send the entire tweet object
                      auto_categorize: true
                    }),
                  });
                  // We're not awaiting this request to keep the fetching process fast
                  // Errors will be handled in the processTweet endpoint
                } catch (processingError) {
                  console.error('Error sending tweet for processing:', processingError);
                }
              }
            }
          }
    
          // Update cursor for next batch
          cursor = response?.next?.value || null;
    
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
    
        } catch (error) {
          console.error('Error fetching tweets:', error);
          break;
        }
      } while (cursor && allTweets.length < 1000); // Add safety limit
    
      return allTweets;
    };

    // Get new tweets from bookmarks
    const filteredTweets = await fetchTodaysTweets();
    console.log("New tweets length: ", filteredTweets.length);
    
    // Get category counts from the database
    const categoryCounts = await getCategoryCounts();
    
    // Get total count of processed tweets
    const totalProcessed = Object.values(categoryCounts).reduce((sum, count) => sum + (count || 0), 0);
    
    // Add valid categories to the response for the frontend
    return NextResponse.json({
      newTweetsCount: filteredTweets.length,
      validCategories: tweetCategoryEnum.enumValues,
      categoryCounts: categoryCounts,
      totalProcessed: totalProcessed,
      status: "success"
    });
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return NextResponse.json({ error: 'Failed to fetch tweets.' }, { status: 500 });
  }
}
