
'use server'

import type { Article } from '@/lib/types';

export async function getArticles(query: string): Promise<{ articles?: Article[], error?: string }> {
    try {
        const apiKey = process.env.NEWS_API_KEY;
        if (!apiKey) {
            console.error("NewsAPI key is missing. Please add it to your .env file.");
            return { error: "API key is not configured. Please contact the administrator." };
        }
        
        const res = await fetch(`https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&apiKey=${apiKey}`);

        if (!res.ok) {
            if (res.status === 401) {
                console.error("Authentication error: Please check your NewsAPI key.");
                return { error: "Invalid API key. Please check your configuration." };
            }
            const errorBody = await res.json();
            console.error(`Failed to fetch articles. Status: ${res.status}`, errorBody);
            return { error: `Failed to fetch articles: ${errorBody.message}` };
        }

        const data = await res.json();

        if (data.status === 'error') {
            console.error("NewsAPI Error:", data.message);
            return { error: `NewsAPI Error: ${data.message}` };
        }

        // Filter out articles that have "[Removed]" as title or have no image/content
        const validArticles = data.articles.filter((article: any) =>
            article.title && article.title !== "[Removed]" &&
            article.content &&
            article.urlToImage
        );

        return {
            articles: validArticles.map((article: any) => ({
                id: article.url, // Use URL as a more stable ID
                title: article.title,
                source: article.source.name,
                imageUrl: article.urlToImage,
                url: article.url,
                content: article.content,
                keywords: query === 'cryptocurrency' ? [] : [query.toLowerCase()],
                publishedAt: article.publishedAt,
            }))
        };
    } catch (e: any) {
        console.error("Error fetching articles:", e.message);
        return { error: "Failed to fetch news. Please try again later." };
    }
}
