#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reddit Scraper - Fetches top posts from any subreddit
Usage: python reddit_scraper.py <subreddit_name>
Example: python reddit_scraper.py n8n
"""

import sys
import os
import requests
from datetime import datetime

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')


def fetch_top_posts(subreddit, limit=3):
    """
    Fetch top posts from a subreddit using Reddit's public JSON API
    
    Args:
        subreddit (str): Name of the subreddit (without r/)
        limit (int): Number of posts to fetch (default: 3)
    
    Returns:
        list: List of post dictionaries or None if error
    """
    url = f"https://www.reddit.com/r/{subreddit}/top.json"
    headers = {
        'User-Agent': 'RedditScraper/1.0 (Educational purposes)'
    }
    params = {
        'limit': limit,
        't': 'day'  # Top posts from today
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        posts = data.get('data', {}).get('children', [])
        
        if not posts:
            print(f"⚠️  No posts found in r/{subreddit}")
            return None
        
        return posts
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"❌ Error: Subreddit 'r/{subreddit}' not found")
        elif e.response.status_code == 403:
            print(f"❌ Error: Access forbidden to r/{subreddit} (may be private)")
        else:
            print(f"❌ HTTP Error: {e}")
        return None
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Network Error: {e}")
        return None
    
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return None


def format_timestamp(unix_timestamp):
    """Convert Unix timestamp to readable format"""
    dt = datetime.fromtimestamp(unix_timestamp)
    return dt.strftime('%Y-%m-%d %H:%M:%S')


def display_posts(posts, subreddit):
    """
    Display posts in a formatted way
    
    Args:
        posts (list): List of post data from Reddit API
        subreddit (str): Name of the subreddit
    """
    print(f"\n{'='*80}")
    print(f"🔥 TOP {len(posts)} POSTS FROM r/{subreddit}")
    print(f"{'='*80}\n")
    
    for idx, post_data in enumerate(posts, 1):
        post = post_data['data']
        
        title = post.get('title', 'N/A')
        author = post.get('author', 'N/A')
        score = post.get('score', 0)
        num_comments = post.get('num_comments', 0)
        url = f"https://www.reddit.com{post.get('permalink', '')}"
        created = format_timestamp(post.get('created_utc', 0))
        
        print(f"📌 POST #{idx}")
        print(f"{'─'*80}")
        print(f"Title:     {title}")
        print(f"Author:    u/{author}")
        print(f"Score:     ⬆️  {score:,} upvotes")
        print(f"Comments:  💬 {num_comments:,} comments")
        print(f"Posted:    {created}")
        print(f"URL:       {url}")
        print(f"{'─'*80}\n")


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python reddit_scraper.py <subreddit_name>")
        print("Example: python reddit_scraper.py n8n")
        sys.exit(1)
    
    subreddit = sys.argv[1].strip()
    
    # Remove 'r/' prefix if user included it
    if subreddit.lower().startswith('r/'):
        subreddit = subreddit[2:]
    
    print(f"🔍 Fetching top posts from r/{subreddit}...")
    
    posts = fetch_top_posts(subreddit, limit=3)
    
    if posts:
        display_posts(posts, subreddit)
        print(f"✅ Successfully fetched {len(posts)} posts from r/{subreddit}\n")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
