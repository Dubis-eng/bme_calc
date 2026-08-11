---
name: reddit-scraper
description: Scrapes top posts from Reddit subreddits using the public JSON API. Use when the user mentions Reddit, subreddit posts, fetching Reddit data, or scraping social media content from Reddit.
---

# Reddit Scraping Skill

## When to use this skill

- User wants to fetch top posts from a specific subreddit
- User needs to extract Reddit data (titles, authors, scores, comments)
- User mentions scraping or analyzing Reddit content
- User wants to monitor trending posts from subreddits

## Workflow

Use this checklist to track progress:

- [ ] Identify target subreddit(s)
- [ ] Install dependencies if needed (`pip install -r .agent/skills/reddit-scraper/resources/requirements.txt`)
- [ ] Run the scraper script with the subreddit name
- [ ] Parse and present the results to the user
- [ ] Handle any errors (invalid subreddit, private subreddit, network issues)

## Instructions

### Basic Usage

Run the scraper script from the command line:

```bash
python .agent/skills/reddit-scraper/scripts/reddit_scraper.py <subreddit_name>
```

**Parameters:**

- `<subreddit_name>`: Name of the subreddit (with or without 'r/' prefix)

### Technical Details

- **API**: Uses Reddit's public JSON API (no authentication required)
- **Endpoint**: `https://www.reddit.com/r/{subreddit}/top.json`
- **Rate Limits**: Respects Reddit's rate limits
