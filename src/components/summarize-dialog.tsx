"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { summarizeArticle } from '@/ai/flows/summarize-article';
import { ScrollArea } from './ui/scroll-area';

interface SummarizeDialogProps {
  content: string;
  title: string;
}

export function SummarizeDialog({ content, title }: SummarizeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (summary) return; // Don't re-fetch if summary already exists

    setIsLoading(true);
    setError('');
    
    try {
      const result = await summarizeArticle({ articleContent: content });
      if (result.summary) {
        setSummary(result.summary);
      } else {
        throw new Error("The AI returned an empty summary.");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Summarization Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      handleSummarize();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">AI-Powered Summary</DialogTitle>
          <DialogDescription>
            {title}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {summary && !isLoading && (
            <ScrollArea className="h-auto max-h-64">
                <p className="text-sm leading-relaxed text-foreground/80">{summary}</p>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
