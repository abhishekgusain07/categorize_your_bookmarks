import { NextRequest, NextResponse } from 'next/server';
import { Rettiwt } from 'rettiwt-api';
import { db } from '@/db/drizzle';
import { processedTweets } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const rettiwt = new Rettiwt({ apiKey: process.env.TWITTER_KEY });
    
    // Check if we should force a deeper check (more sample size)
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';
    
    // Get total count of already processed tweets
    const existingProcessedTweets = await db
      .select({ id: processedTweets.id })
      .from(processedTweets);
    
    // Create a set of already processed tweet IDs for quick lookup
    const processedTweetIds = new Set(existingProcessedTweets.map(tweet => tweet.id));
    
    // Get a sampling of bookmarked tweets to check for new ones
    let newTweetCount = 0;
    let cursor = null;
    const count = forceRefresh ? 20 : 10; // Use larger sample size for force refresh
    const maxSampleSize = forceRefresh ? 60 : 30; // Check more tweets on force refresh
    let sampledTweets = 0;
    
    // First batch
    try {
      const response = await rettiwt.user.bookmarks(count);
      
      if (response?.list?.length > 0) {
        for (const tweet of response.list) {
          sampledTweets++;
          if (!processedTweetIds.has(tweet.id)) {
            newTweetCount++;
          }
        }
        
        // Only check a second batch if we found less than 3 new tweets and haven't hit max sample size
        if (newTweetCount < 3 && sampledTweets < maxSampleSize && response?.next?.value) {
          cursor = response.next.value;
          
          const secondResponse = await rettiwt.user.bookmarks(count, cursor);
          
          if (secondResponse?.list?.length > 0) {
            for (const tweet of secondResponse.list) {
              sampledTweets++;
              if (!processedTweetIds.has(tweet.id)) {
                newTweetCount++;
              }
              if (sampledTweets >= maxSampleSize) break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new tweets:', error);
      // Continue with what we have, even if there's an error
    }
    
    return NextResponse.json({
      hasNewTweets: newTweetCount > 0,
      estimatedNewTweets: newTweetCount,
      totalProcessed: processedTweetIds.size,
      status: "success"
    });
    
  } catch (error) {
    console.error("Error checking for new tweets:", error);
    return NextResponse.json({ 
      error: 'Failed to check for new tweets',
      status: "error" 
    }, { status: 500 });
  }
} 