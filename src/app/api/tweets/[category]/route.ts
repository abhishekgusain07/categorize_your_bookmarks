import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { processedTweets, tweetCategoryEnum } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    // Ensure the table exists before using it
    await ensureTablesExist();
    
    const { category } = params;
    
    // Validate that the category is valid
    if (!tweetCategoryEnum.enumValues.includes(category as any)) {
      return NextResponse.json(
        { 
          error: 'Invalid category', 
          validCategories: tweetCategoryEnum.enumValues 
        },
        { status: 400 }
      );
    }
    
    // Get tweets for the specified category
    // Cast the category to the enum type to satisfy TypeScript
    const validCategory = category as typeof tweetCategoryEnum.enumValues[number];
    
    const tweets = await db
      .select({
        id: processedTweets.id,
        tweet_url: processedTweets.tweet_url,
        processedAt: processedTweets.processedAt,
      })
      .from(processedTweets)
      .where(eq(processedTweets.category, validCategory))
      .orderBy(processedTweets.processedAt)
      .limit(100); // Limit to 100 tweets for performance
    
    return NextResponse.json({
      category,
      tweets,
      count: tweets.length,
      status: "success"
    });
  } catch (error) {
    console.error(`Error fetching tweets for category ${params.category}:`, error);
    return NextResponse.json({ error: 'Failed to fetch tweets.' }, { status: 500 });
  }
} 