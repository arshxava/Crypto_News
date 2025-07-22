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
import { ArrowUpRight } from 'lucide-react';
import { SummarizeDialog } from './summarize-dialog';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader>
        <Badge variant="secondary" className="mb-2 w-fit">
          {article.source}
        </Badge>
        <CardTitle className="text-lg font-bold leading-tight">
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="aspect-video overflow-hidden rounded-md">
           <Image
             src={article.imageUrl}
             alt={article.title}
             width={600}
             height={400}
             className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
             data-ai-hint="crypto technology"
           />
        </div>
      </CardContent>
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
