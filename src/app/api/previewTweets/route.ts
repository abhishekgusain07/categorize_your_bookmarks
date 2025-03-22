import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { processedTweets } from '@/db/schema';
import { Rettiwt } from 'rettiwt-api';

interface PreviewTweet {
  id: string;
  text: string;
  author: string;
  created_at: string;
  url: string;
}

export async function GET() {
  try {
    const rettiwt = new Rettiwt({ apiKey: process.env.TWITTER_KEY });

    // Get existing processed tweet IDs
    const existingProcessedTweets = await db
      .select({ id: processedTweets.id })
      .from(processedTweets);
    
    const processedTweetIds = new Set(existingProcessedTweets.map(tweet => tweet.id));
    
    // Fetch latest bookmarks
    const response = await rettiwt.user.bookmarks(10); // Fetch 10 latest bookmarks
    
    if (!response?.list?.length) {
      return NextResponse.json({ tweets: [] });
    }

    // Filter out processed tweets and format the response
    const unprocessedTweets = response.list
      .filter(tweet => !processedTweetIds.has(tweet.id))
      .slice(0, 5) // Take max 5 tweets
      .map(tweet => ({
        id: tweet.id,
        text: tweet.fullText,
        author: tweet.tweetBy?.userName || 'Unknown',
        created_at: tweet.createdAt,
        url: `https://x.com/${tweet.tweetBy?.userName || 'user'}/status/${tweet.id}`,
      }));

    return NextResponse.json({
      tweets: unprocessedTweets,
    });
  } catch (error) {
    console.error('Error fetching preview tweets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview tweets' },
      { status: 500 }
    );
  }
} 