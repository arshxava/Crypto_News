
"use client";

import { useEffect, useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useArticleStore } from '@/lib/store';
import type { Article } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ArticlePage() {
    const router = useRouter();
    const params = useParams();
    const articleId = params.articleId;
    const { getArticleById } = useArticleStore();
    const [article, setArticle] = useState<Article | undefined | null>(undefined); // undefined: loading, null: not found

    useEffect(() => {
        if (typeof articleId === 'string') {
            const foundArticle = getArticleById(articleId);
            setArticle(foundArticle || null);
        }
    }, [articleId, getArticleById]);
    
    if (article === undefined) {
        // Loading state
        return (
            <div className="container max-w-4xl mx-auto py-8">
                <Skeleton className="h-16 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/4 mb-8" />
                <Skeleton className="h-96 w-full mb-8" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
            </div>
        );
    }
    
    if (article === null) {
        // Not found state
        notFound();
        return null;
    }

    const displayTitle = article.rewrittenTitle || article.title;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className="flex-1 py-12">
                <article className="container max-w-4xl mx-auto">
                    <header className="mb-8">
                        <div className="mb-4 flex flex-wrap gap-2">
                            <Badge variant="secondary">{article.source}</Badge>
                            <Badge variant={article.type === 'blog' ? 'default' : 'outline'} className="capitalize">
                                {article.type}
                            </Badge>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tighter mb-4">
                            {displayTitle}
                        </h1>
                        {article.publishedAt && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Published on {format(new Date(article.publishedAt), 'PPP')}</span>
                            </div>
                        )}
                    </header>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="relative mb-8 w-full aspect-video overflow-hidden rounded-lg">
                             <Image
                                src={article.imageUrl}
                                alt={displayTitle}
                                layout="fill"
                                className="object-cover"
                                unoptimized
                            />
                        </div>

                        {/* Use whitespace-pre-wrap to respect newlines from the AI's response */}
                        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                            {article.content}
                        </p>
                    </div>
                </article>
            </main>
        </div>
    );
}
