
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

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const isPlaceholder = article.imageUrl.includes('placehold.co');

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
          {article.title}
        </CardTitle>
        {article.publishedAt && (
            <div className="flex items-center pt-2 text-xs text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                {format(new Date(article.publishedAt), 'PPP')}
            </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {isPlaceholder ? (
          <div className="aspect-video overflow-hidden rounded-md bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center">
             <span className="text-xs font-medium text-muted-foreground">No Image</span>
          </div>
        ) : (
          <div className="aspect-video overflow-hidden rounded-md">
            <Image
              src={article.imageUrl}
              alt={article.title}
              width={600}
              height={400}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              data-ai-hint="crypto technology"
              onError={(e) => {
                  // In case of image loading error, fallback to placeholder logic
                  e.currentTarget.parentElement?.parentElement?.classList.add('no-image');
              }}
            />
          </div>
        )}
      </CardContent>
      <style jsx>{`
        .no-image .aspect-video {
            display: none;
        }
        .no-image::before {
            content: '';
            display: block;
            padding-top: 56.25%;
            background: linear-gradient(to bottom right, hsl(var(--primary-foreground)), hsl(var(--secondary)));
            border-radius: var(--radius);
        }
      `}</style>
      <CardFooter className="flex justify-between gap-2">
        <SummarizeDialog content={article.content} title={article.title} />
        <Button asChild variant="ghost" size="sm">
          <Link href={article.url} target="_blank" rel="noopener noreferrer">
            Read More
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
