import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { processedTweets, tweetCategoryEnum } from '@/db/schema';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Rate limiter implementation
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per ms
  private lastRefillTimestamp: number;

  constructor(maxRequestsPerMinute: number) {
    this.maxTokens = maxRequestsPerMinute;
    this.tokens = maxRequestsPerMinute;
    this.refillRate = maxRequestsPerMinute / (60 * 1000); // Convert to tokens per ms
    this.lastRefillTimestamp = Date.now();
  }

  async getToken(): Promise<boolean> {
    this.refill();
    
    if (this.tokens < 1) {
      // Calculate wait time until next token is available
      const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);
      console.log(`Rate limit reached. Waiting ${waitTime}ms for next token`);
      
      // Wait for the required time
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill(); // Refill after waiting
    }
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    
    return false;
  }

  private refill() {
    const now = Date.now();
    const elapsedTime = now - this.lastRefillTimestamp;
    
    // Calculate tokens to add based on elapsed time
    const tokensToAdd = elapsedTime * this.refillRate;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTimestamp = now;
    }
  }
}

// Create a singleton rate limiter instance (10 requests per minute)
const geminiRateLimiter = new RateLimiter(10);

// Get all valid categories
const validCategories = tweetCategoryEnum.enumValues;

// Function to categorize tweet using Google Gemini via Vercel AI SDK
async function categorizeTweetWithGemini(tweetData: any, tweetUrl: string): Promise<string> {
  try {
    // Extract relevant text from the tweet data
    // This will depend on the actual structure of the tweet object
    let tweetContent = '';
    
    // Try to extract content from various possible properties
    if (typeof tweetData === 'object') {
      // Attempt to get text content from various possible properties
      tweetContent = tweetData.fullText || 
                    tweetData.text || 
                    tweetData.content || 
                    (tweetData.tweetBy ? `Tweet by ${tweetData.tweetBy.userName || tweetData.tweetBy.name}` : '');
      
      // If we still don't have content, try to extract from entities or other properties
      if (!tweetContent && tweetData.entities && tweetData.entities.description) {
        tweetContent = tweetData.entities.description;
      }
      
      // If all else fails, stringify the object but limit its size
      if (!tweetContent) {
        tweetContent = JSON.stringify(tweetData).substring(0, 500) + '...';
      }
    } else {
      tweetContent = String(tweetData);
    }

    // Create the prompt for Gemini with detailed category descriptions
    const prompt = `
    You are a tweet categorization expert. Your task is to categorize the following tweet into EXACTLY ONE of these categories:
    
    - tech: Technology, programming, AI, software development, hardware, tech news, etc.
    - life_advice: Personal development, life tips, motivation, self-improvement, etc.
    - marketing_advice: Marketing strategies, branding, customer acquisition, sales, etc.
    - better_engineer: Software engineering best practices, coding tips, architecture, etc.
    - resources: Useful tools, websites, books, courses, learning materials, etc.
    - productivity: Time management, efficiency, workflow optimization, focus, etc.
    - finance: Money management, investing, crypto, stocks, financial advice, etc.
    - wisdom: Philosophical insights, deep thoughts, mental models, etc.
    - perspective: Unique viewpoints, paradigm shifts, alternative thinking, etc.
    - health: Physical health, mental health, wellness, fitness, nutrition, etc.
    - food: Recipes, cooking tips, restaurants, diet, culinary experiences, etc.
    
    Tweet: "${tweetContent}"
    Tweet URL: ${tweetUrl}
    
    IMPORTANT: You MUST choose exactly one category from the list above. Do not create new categories.
    Respond with ONLY the category name, nothing else. For example: "tech" or "life_advice".
    `;

    // Wait for a rate limit token before making the API call
    await geminiRateLimiter.getToken();

    // Use Vercel AI SDK to generate text with Gemini
    const { text: generatedText } = await generateText({
      model: google('gemini-1.5-flash'), // Using a standard model instead of experimental
      prompt: prompt,
      maxTokens: 10, // We only need a short response
      temperature: 0.1, // Lower temperature for more deterministic results
    });
    
    // Clean up the response to get just the category
    const category = generatedText.trim().toLowerCase();
    
    // Validate that the category is one of our valid categories
    if (validCategories.includes(category as any)) {
      return category as typeof tweetCategoryEnum.enumValues[number];
    } else {
      // If the model returns an invalid category, make a best guess from valid categories
      console.log(`Invalid category returned by Gemini: ${category}, finding best match...`);
      
      // Simple matching algorithm to find the closest valid category
      const bestMatch = findBestCategoryMatch(category, validCategories);
      console.log(`Mapped invalid category "${category}" to "${bestMatch}"`);
      return bestMatch;
    }
  } catch (error) {
    console.error('Error categorizing tweet with Gemini:', error);
    // Default to a reasonable category if AI fails completely
    return 'resources';
  }
}

// Helper function to find the best matching category
function findBestCategoryMatch(input: string, validOptions: string[]): string {
  // If input is empty or undefined, return a default category
  if (!input) return 'resources';
  
  // Check if any valid category is contained within the input
  for (const option of validOptions) {
    if (input.includes(option)) {
      return option;
    }
  }
  
  // If no direct match, use a simple scoring system
  let bestMatch = validOptions[0];
  let highestScore = 0;
  
  for (const option of validOptions) {
    let score = 0;
    const optionWords = option.split('_');
    
    // Check for word matches
    for (const word of optionWords) {
      if (input.includes(word)) {
        score += 1;
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = option;
    }
  }
  
  return bestMatch;
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

export async function POST(request: NextRequest) {
  try {
    // Call this function before using the table
    await ensureTablesExist();

    const body = await request.json();
    const { tweetId, tweet_url, tweet_data, category, auto_categorize } = body;

    // Validate required fields
    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      );
    }

    // Determine the category
    let finalCategory = category;

    // If auto_categorize is true and no category is provided, use Gemini to categorize
    if (auto_categorize && !category && tweet_data) {
      finalCategory = await categorizeTweetWithGemini(tweet_data, tweet_url);
      console.log(`Auto-categorized tweet ${tweetId} as: ${finalCategory}`);
    } 
    // If a category is provided, validate it
    else if (category) {
      // Validate category is one of the allowed values
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { 
            error: 'Invalid category', 
            validCategories 
          },
          { status: 400 }
        );
      }
    }

    // Insert the processed tweet into the database
    await db.insert(processedTweets).values({
      id: tweetId,
      tweet_url: tweet_url || null,
      category: finalCategory || null,
      processedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Tweet marked as processed',
      category: finalCategory
    });
  } catch (error) {
    console.error('Error processing tweet:', error);
    return NextResponse.json(
      { error: 'Failed to process tweet' },
      { status: 500 }
    );
  }
} 