
"use client";

import * as React from 'react';
import { useState, useMemo, useEffect, startTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArticleCard } from '@/components/article-card';
import { Search, Rss } from 'lucide-react';
import type { Article } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getArticles } from './actions';

const FILTERS = ['All', 'Bitcoin', 'Ethereum', 'NFTs', 'DeFi', 'Regulation'];


export default function Home() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [fetchError, setFetchError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            const query = activeFilter === 'All' ? 'cryptocurrency' : activeFilter;
            const result = await getArticles(query);
            
            startTransition(() => {
                setArticles(result.articles || []);
                setFetchError(result.error);
                setLoading(false);
            });
        };
        fetchArticles();
    }, [activeFilter]);

    const filteredArticles = useMemo(() => {
        if (!searchTerm) {
            return articles;
        }
        return articles.filter((article) =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, articles]);


  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-2">
             <Rss className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">CryptoFlash</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-screen-2xl py-8">
          <div className="mb-8 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Latest Crypto News & Blogs
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="w-full rounded-full pl-10 md:w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? 'default' : 'outline'}
                  onClick={() => setActiveFilter(filter)}
                  className="rounded-full"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
          
          {loading ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-96 w-full" />
                ))}
            </div>
          ) : fetchError ? (
             <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive p-12 text-center">
                <h3 className="text-xl font-medium tracking-tight text-destructive">Error Fetching News</h3>
                <p className="text-muted-foreground">{fetchError}</p>
            </div>
          ) : filteredArticles.length > 0 ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {filteredArticles.map((article, index) => (
                 <ArticleCard key={`${article.id}-${index}`} article={article} />
               ))}
             </div>
           ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <h3 className="text-xl font-medium tracking-tight">No articles found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
           )}
        </div>
      </main>
      <footer className="py-6 md:px-8 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by you. Powered by AI.
            </p>
          </div>
      </footer>
    </div>
  );
}
