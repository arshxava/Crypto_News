
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Calendar } from 'lucide-react';
import { SummarizeDialog } from './summarize-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {

  const displayTitle = useMemo(() => article.rewrittenTitle || article.title, [article]);
  const articleId = useMemo(() => encodeURIComponent(article.id), [article.id]);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader>
        <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="w-fit">
              {article.source}
            </Badge>
            <Badge variant={article.type === 'blog' ? 'default' : 'outline'} className={cn(
                "w-fit capitalize",
                article.type === 'blog' && "bg-accent text-accent-foreground"
            )}>
              {article.type}
            </Badge>
        </div>
        <CardTitle className="text-lg font-bold leading-tight">
          {displayTitle}
        </CardTitle>
        {article.publishedAt && (
            <div className="flex items-center pt-2 text-xs text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                {format(new Date(article.publishedAt), 'PPP')}
            </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="aspect-video overflow-hidden rounded-md">
            <Image
              src={article.imageUrl}
              alt={displayTitle}
              width={600}
              height={400}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              unoptimized
            />
          </div>
      </CardContent>
      <CardFooter className="mt-auto flex justify-between gap-2 pt-4">
        <SummarizeDialog content={article.content} title={displayTitle} />
        <Button asChild variant="ghost" size="sm">
          <Link href={`/article/${articleId}`}>
            Read More
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
