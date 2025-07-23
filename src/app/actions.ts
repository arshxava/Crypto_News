
'use server'

import type { Article } from '@/lib/types';

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
        // CryptoPanic doesn't provide a direct image URL, so we use a placeholder.
        imageUrl: `https://placehold.co/600x400.png`,
        url: article.url,
        content: `Title: ${article.title}`, // Content is not provided, use title as placeholder
        keywords: (article.currencies || []).map((c: any) => c.code.toLowerCase()),
        publishedAt: article.created_at,
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
        imageUrl: article.imageurl,
        url: article.url,
        content: article.body,
        keywords: (article.categories || '').split(',').map((c:string) => c.trim().toLowerCase()),
        publishedAt: new Date(article.published_on * 1000).toISOString(),
    }));
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

        if (allPromises.length === 0) {
            return { error: "No API keys are configured. Please add at least one to your .env file." };
        }

        const results = await Promise.all(results => results);
        const allArticles = results.flat();
        
        // Sort all articles by date, descending
        allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        return { articles: allArticles };

    } catch (e: any) {
        console.error("Error fetching articles:", e.message);
        return { error: "Failed to fetch news. Please try again later." };
    }
}
