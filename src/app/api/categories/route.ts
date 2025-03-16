import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { processedTweets, tweetCategoryEnum } from '@/db/schema';
import { count } from 'drizzle-orm';

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

export async function GET(request: NextRequest) {
  try {
    // Ensure the table exists before using it
    await ensureTablesExist();
    
    // Get category counts from the database
    const categoryCounts = await getCategoryCounts();
    
    // Get total count of processed tweets
    const totalProcessed = Object.values(categoryCounts).reduce((sum, count) => sum + (count || 0), 0);
    
    // Return the category counts
    return NextResponse.json({
      validCategories: tweetCategoryEnum.enumValues,
      categoryCounts: categoryCounts,
      totalProcessed: totalProcessed,
      status: "success"
    });
  } catch (error) {
    console.error("Error fetching category counts:", error);
    return NextResponse.json({ error: 'Failed to fetch category counts.' }, { status: 500 });
  }
} 