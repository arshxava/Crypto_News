
'use server'

import type { Article } from '@/lib/types';
import Parser from 'rss-parser';
import { processArticle } from '@/ai/flows/process-article-flow';


// Helper function for NewsAPI
async function getNewsApiArticles(query: string, apiKey: string): Promise<Article[]> {
    const res = await fetch(`https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&apiKey=${apiKey}`);
    if (!res.ok) {
        console.error(`NewsAPI failed: ${res.statusText}`);
        return [];
    }
    const data = await res.json();
    if (data.status === 'error') {
        console.error(`NewsAPI error: ${data.message}`);
        return [];
    }
    // Filter out articles that have "[Removed]" as title or have no image/content
    return data.articles
        .filter((article: any) =>
            article.title && article.title !== "[Removed]" &&
            article.content &&
            article.urlToImage
        )
        .map((article: any) => ({
            id: article.url,
            title: article.title,
            source: article.source.name,
            imageUrl: article.urlToImage,
            url: article.url,
            content: article.content,
            keywords: query === 'cryptocurrency' ? [] : [query.toLowerCase()],
            publishedAt: article.publishedAt,
            type: 'news' as const,
        }));
}

// Helper function for CryptoPanic
async function getCryptoPanicArticles(query: string, apiKey: string): Promise<Article[]> {
    const filter = query === 'cryptocurrency' ? '' : `&currencies=${query.toUpperCase()}`;
    const res = await fetch(`https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&public=true${filter}`);
    if (!res.ok) {
        console.error(`CryptoPanic failed: ${res.statusText}`);
        return [];
    }
    const data = await res.json();
    return (data.results || []).map((article: any) => ({
        id: article.url,
        title: article.title,
        source: article.source.domain,
        imageUrl: `https://placehold.co/600x400.png`,
        url: article.url,
        content: `Title: ${article.title}`, // Content is not provided, use title as placeholder
        keywords: (article.currencies || []).map((c: any) => c.code.toLowerCase()),
        publishedAt: article.created_at,
        type: 'news' as const,
    }));
}

// Helper function for CryptoCompare
async function getCryptoCompareArticles(query: string, apiKey: string): Promise<Article[]> {
    const categories = query === 'cryptocurrency' ? '' : `&categories=${query.toUpperCase()}`;
    const res = await fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN${categories}`, {
        headers: { 'authorization': `Apikey ${apiKey}` }
    });
    if (!res.ok) {
        console.error(`CryptoCompare failed: ${res.statusText}`);
        return [];
    }
    const data = await res.json();
    if (data.Type !== 100) {
        console.error(`CryptoCompare error: ${data.Message}`);
        return [];
    }
    return (data.Data || []).map((article: any) => ({
        id: article.url,
        title: article.title,
        source: article.source,
        imageUrl: article.imageurl || `https://placehold.co/600x400.png`,
        url: article.url,
        content: article.body,
        keywords: (article.categories || '').split(',').map((c:string) => c.trim().toLowerCase()),
        publishedAt: new Date(article.published_on * 1000).toISOString(),
        type: 'news' as const,
    }));
}

// Helper function for RSS Feeds
async function getRssArticles(query: string): Promise<Article[]> {
    const parser = new Parser();
    const rssFeeds = [
        { url: 'https://cointelegraph.com/rss', type: 'news' },
        { url: 'https://cryptoslate.com/feed/', type: 'news' },
        { url: 'https://www.binance.com/en/blog/feed', type: 'blog' },
        { url: 'https://bitcoinmagazine.com/feed', type: 'blog' }
    ] as const;
    let allRssArticles: Article[] = [];

    for (const feed of rssFeeds) {
        try {
            const parsedFeed = await parser.parseURL(feed.url);
            const articles = parsedFeed.items.map(item => ({
                id: item.link || item.guid || item.id,
                title: item.title || '',
                source: new URL(parsedFeed.link || feed.url).hostname,
                imageUrl: item.enclosure?.url || `https://placehold.co/600x400.png`,
                url: item.link || '',
                content: item.contentSnippet || item.content || item.summary || '',
                keywords: (item.categories || []).map(c => c.toLowerCase()),
                publishedAt: item.isoDate || new Date().toISOString(),
                type: feed.type
            }));
            allRssArticles.push(...articles);
        } catch (error) {
            console.error(`Failed to fetch or parse RSS feed: ${feed.url}`, error);
        }
    }
    
    if (query.toLowerCase() === 'cryptocurrency') {
        return allRssArticles;
    }

    const lowerCaseQuery = query.toLowerCase();
    
    return allRssArticles.filter(article => {
        if (!article.title || !article.content) return false;
        const titleMatch = article.title.toLowerCase().includes(lowerCaseQuery);
        const contentMatch = article.content.toLowerCase().includes(lowerCaseQuery);
        const keywordMatch = article.keywords.includes(lowerCaseQuery);
        return titleMatch || contentMatch || keywordMatch;
    });
}


export async function getArticles(query: string): Promise<{ articles?: Article[], error?: string }> {
    try {
        const newsApiKey = process.env.NEWS_API_KEY;
        const cryptoPanicKey = process.env.CRYPTO_PANIC_KEY;
        const cryptoCompareKey = process.env.CRYPTO_COMPARE_KEY;

        const allPromises = [];

        if (newsApiKey) {
            allPromises.push(getNewsApiArticles(query, newsApiKey));
        } else {
             console.warn("NewsAPI key is missing.");
        }

        if (cryptoPanicKey) {
            allPromises.push(getCryptoPanicArticles(query, cryptoPanicKey));
        } else {
            console.warn("CryptoPanic key is missing.");
        }
        
        if (cryptoCompareKey) {
            allPromises.push(getCryptoCompareArticles(query, cryptoCompareKey));
        } else {
            console.warn("CryptoCompare key is missing.");
        }
        
        // Always fetch RSS articles
        allPromises.push(getRssArticles(query));

        if (allPromises.length === 1) { // Only RSS fetch is pushed
            return { error: "No API keys are configured. Please add at least one to your .env file to get news from APIs." };
        }

        const initialResults = await Promise.allSettled(allPromises);
        let allArticles = initialResults
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => (result as PromiseFulfilledResult<Article[]>).value);
        
        // Sort all articles by date, descending
        allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        // Take the top 12 articles to avoid excessive AI processing
        allArticles = allArticles.slice(0, 12);
        
        // Process articles with AI
        const processedArticlePromises = allArticles.map(article => 
            processArticle({
                title: article.title,
                content: article.content,
            }).then(processed => ({
                ...article, // Keep original data like id, url, etc.
                content: processed.rewrittenContent,
                imageUrl: processed.generatedImageUrl,
            }))
        );

        const processedResults = await Promise.allSettled(processedArticlePromises);

        const successfullyProcessedArticles = processedResults
            .filter(result => {
                if (result.status === 'rejected') {
                    console.error("Failed to process article with AI:", result.reason);
                    return false;
                }
                return true;
            })
            .map(result => (result as PromiseFulfilledResult<Article>).value);


        return { articles: successfullyProcessedArticles };

    } catch (e: any) {
        console.error("Error fetching articles:", e.message);
        return { error: "Failed to fetch news. Please try again later." };
    }
}
