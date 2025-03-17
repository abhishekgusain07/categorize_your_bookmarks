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

// Category descriptions for more accurate classification
const categoryDescriptions = {
  tech_news: "News about technology companies, product launches, tech industry updates, announcements",
  programming: "Code snippets, programming languages, software development practices, coding tips, developer tools",
  ai_ml: "Artificial intelligence, machine learning, data science, neural networks, AI tools and applications",
  career_advice: "Job hunting tips, career growth strategies, interview advice, workplace navigation, professional development",
  personal_growth: "Self-improvement, personal development, habits, mindset shifts, life optimization",
  marketing: "Marketing strategies, growth hacking, advertising techniques, customer acquisition, branding",
  design: "UI/UX design, graphic design, product design, creative processes, design thinking",
  startup: "Startup advice, entrepreneurship, funding, business models, company building",
  productivity: "Time management, efficiency techniques, workflow optimization, focus strategies, productivity tools",
  finance: "Investing, money management, financial advice, economics, wealth building",
  mental_models: "Thinking frameworks, decision-making strategies, cognitive biases, mental frameworks",
  health_fitness: "Physical health, exercise routines, nutrition advice, wellness practices, fitness tips",
  tools_resources: "Useful software tools, websites, apps, resources, utilities that help with specific tasks",
  tutorials: "Step-by-step guides, how-to content, educational material, learning resources",
  inspiration: "Motivational content, success stories, encouraging messages, positive reinforcement",
  books: "Book recommendations, reading lists, book summaries, literature discussions",
  philosophy: "Deep thoughts, philosophical ideas, meaning of life, ethical considerations",
  science: "Scientific discoveries, research findings, academic insights, scientific explanations",
  future_trends: "Predictions about the future, emerging technologies, upcoming shifts, trend analysis"
};

// Extract tweet content from tweet data
function extractTweetContent(tweetData: any): string {
  if (!tweetData) return '';
  
  // Try to extract content from various possible properties
  if (typeof tweetData === 'object') {
    // Check for common tweet text fields
    if (tweetData.fullText) return tweetData.fullText;
    if (tweetData.text) return tweetData.text;
    if (tweetData.content) return tweetData.content;
    
    // Check for author and tweet combination
    if (tweetData.tweetBy) {
      const userName = tweetData.tweetBy.userName || tweetData.tweetBy.name || 'user';
      
      // If we have both author and some text content
      if (tweetData.rawContent) {
        return `Tweet by @${userName}: ${tweetData.rawContent}`;
      }
    }
    
    // Check for entities
    if (tweetData.entities) {
      if (tweetData.entities.description) return tweetData.entities.description;
      if (tweetData.entities.text) return tweetData.entities.text;
    }
    
    // Try to extract from nested structures
    if (tweetData.tweet && tweetData.tweet.text) return tweetData.tweet.text;
    if (tweetData.data && tweetData.data.text) return tweetData.data.text;
    
    // If all else fails, stringify but limit size
    return JSON.stringify(tweetData).substring(0, 1000) + '...';
  }
  
  // If it's a string, return it directly
  return String(tweetData);
}

// Function to categorize tweet using Google Gemini via Vercel AI SDK
async function categorizeTweetWithGemini(tweetData: any, tweetUrl: string): Promise<{ category: string, tweetText: string }> {
  try {
    // Extract the tweet content
    const tweetContent = extractTweetContent(tweetData);
    
    // If we couldn't extract any meaningful content
    if (!tweetContent || tweetContent.length < 5) {
      console.log("Could not extract meaningful content from tweet");
      return { category: 'tools_resources', tweetText: tweetContent };
    }

    // Build a detailed prompt with examples for each category
    const categoriesWithDescriptions = Object.entries(categoryDescriptions)
      .map(([category, description]) => `- ${category}: ${description}`)
      .join('\n');
    
    const prompt = `
You are an expert tweet categorizer with deep knowledge of tech, business, and personal development content.

TASK: Categorize the following tweet into EXACTLY ONE of these categories:

${categoriesWithDescriptions}

Tweet: "${tweetContent}"
Tweet URL: ${tweetUrl}

ANALYSIS PROCESS:
1. Carefully read the tweet content
2. Consider the main topic and purpose of the tweet
3. Match it to the most appropriate category based on the descriptions
4. If it could fit multiple categories, choose the one that best captures the primary focus

IMPORTANT GUIDELINES:
- Choose ONLY ONE category from the list above
- Do not create new categories
- Focus on the main topic, not secondary themes
- Consider what would be most useful for someone searching for this content

Your response must be ONLY the category name, nothing else. For example: "programming" or "mental_models".
`;

    // Wait for a rate limit token before making the API call
    await geminiRateLimiter.getToken();

    // Use Vercel AI SDK to generate text with Gemini
    const { text: generatedText } = await generateText({
      model: google('gemini-1.5-flash'), // Using a standard model
      prompt: prompt,
      maxTokens: 10, // We only need a short response
      temperature: 0.1, // Lower temperature for more deterministic results
    });
    
    // Clean up the response to get just the category
    const category = generatedText.trim().toLowerCase();
    
    // Validate that the category is one of our valid categories
    if (validCategories.includes(category as any)) {
      return { 
        category: category as typeof tweetCategoryEnum.enumValues[number],
        tweetText: tweetContent
      };
    } else {
      // If the model returns an invalid category, use our enhanced matching algorithm
      console.log(`Invalid category returned by Gemini: "${category}", finding best match...`);
      
      const bestMatch = findBestCategoryMatch(category, tweetContent);
      console.log(`Mapped invalid category "${category}" to "${bestMatch}"`);
      
      return { 
        category: bestMatch,
        tweetText: tweetContent
      };
    }
  } catch (error) {
    console.error('Error categorizing tweet with Gemini:', error);
    
    // If AI fails, try to use our rule-based categorization as fallback
    const tweetContent = extractTweetContent(tweetData);
    const fallbackCategory = ruleBadedCategorization(tweetContent);
    
    return { 
      category: fallbackCategory,
      tweetText: tweetContent
    };
  }
}

// Enhanced matching algorithm that uses both the AI's response and the tweet content
function findBestCategoryMatch(aiResponse: string, tweetContent: string): string {
  // If AI response is empty, use rule-based categorization
  if (!aiResponse || aiResponse.trim() === '') {
    return ruleBadedCategorization(tweetContent);
  }
  
  // First, check if any category name is contained within the AI response
  for (const category of validCategories) {
    if (aiResponse.includes(category)) {
      return category;
    }
  }
  
  // If no direct match in AI response, check for partial matches
  const partialMatches = validCategories.filter(category => {
    const parts = category.split('_');
    return parts.some(part => aiResponse.includes(part));
  });
  
  if (partialMatches.length > 0) {
    // If we have partial matches, use the tweet content to determine the best one
    return findBestMatchFromContent(partialMatches, tweetContent);
  }
  
  // If no matches at all, fall back to rule-based categorization
  return ruleBadedCategorization(tweetContent);
}

// Find the best category match based on tweet content
function findBestMatchFromContent(categories: string[], tweetContent: string): string {
  const lowerContent = tweetContent.toLowerCase();
  
  // Score each category based on keyword matches
  const scores = categories.map(category => {
    const description = categoryDescriptions[category as keyof typeof categoryDescriptions];
    const keywords = description.toLowerCase().split(/\s+/);
    
    // Count how many keywords from the description appear in the tweet
    const matchCount = keywords.filter(keyword => 
      keyword.length > 3 && lowerContent.includes(keyword)
    ).length;
    
    return { category, score: matchCount };
  });
  
  // Sort by score and return the highest scoring category
  scores.sort((a, b) => b.score - a.score);
  
  // If we have a clear winner, return it
  if (scores.length > 0 && scores[0].score > 0) {
    return scores[0].category;
  }
  
  // If no good matches, use rule-based categorization
  return ruleBadedCategorization(tweetContent);
}

// Rule-based categorization as a fallback
function ruleBadedCategorization(tweetContent: string): string {
  const lowerContent = tweetContent.toLowerCase();
  
  // Define keyword sets for each category
  const categoryKeywords: Record<string, string[]> = {
    tech_news: ['announced', 'launches', 'release', 'update', 'new product', 'tech', 'technology'],
    programming: ['code', 'coding', 'developer', 'programming', 'software', 'github', 'repository'],
    ai_ml: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'gpt', 'llm', 'data science'],
    career_advice: ['career', 'job', 'interview', 'resume', 'hiring', 'workplace', 'promotion'],
    personal_growth: ['habit', 'mindset', 'improve', 'growth', 'better', 'self', 'personal'],
    marketing: ['marketing', 'growth hack', 'customer', 'acquisition', 'brand', 'audience'],
    design: ['design', 'ui', 'ux', 'interface', 'user experience', 'graphic', 'visual'],
    startup: ['startup', 'founder', 'funding', 'venture', 'entrepreneur', 'business model'],
    productivity: ['productivity', 'efficient', 'workflow', 'time management', 'focus', 'distraction'],
    finance: ['money', 'invest', 'finance', 'financial', 'stock', 'market', 'wealth', 'crypto'],
    mental_models: ['mental model', 'thinking', 'framework', 'decision', 'cognitive', 'bias'],
    health_fitness: ['health', 'fitness', 'exercise', 'workout', 'diet', 'nutrition', 'sleep'],
    tools_resources: ['tool', 'resource', 'app', 'website', 'utility', 'software', 'platform'],
    tutorials: ['how to', 'guide', 'tutorial', 'learn', 'step by step', 'explained'],
    inspiration: ['inspire', 'motivation', 'success', 'story', 'achieve', 'overcome'],
    books: ['book', 'read', 'author', 'reading', 'literature', 'novel', 'publication'],
    philosophy: ['philosophy', 'meaning', 'purpose', 'life', 'ethical', 'moral', 'deep thought'],
    science: ['science', 'research', 'study', 'scientific', 'discovery', 'experiment'],
    future_trends: ['future', 'trend', 'prediction', 'emerging', 'next', 'upcoming', 'revolution']
  };
  
  // Score each category based on keyword matches
  const scores = Object.entries(categoryKeywords).map(([category, keywords]) => {
    const matchCount = keywords.filter(keyword => lowerContent.includes(keyword)).length;
    return { category, score: matchCount };
  });
  
  // Sort by score
  scores.sort((a, b) => b.score - a.score);
  
  // If we have a clear winner with at least one match, return it
  if (scores.length > 0 && scores[0].score > 0) {
    return scores[0].category;
  }
  
  // Default fallback if nothing matches
  return 'tools_resources';
}

// Add this to your code before any other database operations
async function ensureTablesExist() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS processed_tweets (
        id TEXT PRIMARY KEY,
        processed_at TIMESTAMP DEFAULT NOW(),
        tweet_url TEXT,
        category TEXT,
        tweet_text TEXT
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

    // Determine the category and extract tweet text
    let finalCategory = category;
    let tweetText = '';

    // If auto_categorize is true and no category is provided, use Gemini to categorize
    if (auto_categorize && !category && tweet_data) {
      const result = await categorizeTweetWithGemini(tweet_data, tweet_url);
      finalCategory = result.category;
      tweetText = result.tweetText;
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
      
      // Extract tweet text even when category is provided
      if (tweet_data) {
        tweetText = extractTweetContent(tweet_data);
      }
    }

    // Insert the processed tweet into the database
    await db.insert(processedTweets).values({
      id: tweetId,
      tweet_url: tweet_url || null,
      category: finalCategory || null,
      processedAt: new Date(),
      tweet_text: tweetText || null
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