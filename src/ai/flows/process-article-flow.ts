
'use server';

/**
 * @fileOverview A Genkit flow for processing news articles.
 * It rewrites the content and title to be original and generates a new image.
 *
 * - processArticle - A function that processes a given article.
 * - ProcessArticleInput - The input type for the processArticle function.
 * - ProcessArticleOutput - The return type for the processArticle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gpt4o } from 'genkit/x/openai';


const ProcessArticleInputSchema = z.object({
  title: z.string().describe('The original title of the article.'),
  content: z.string().describe('The original content of the article.'),
});
export type ProcessArticleInput = z.infer<typeof ProcessArticleInputSchema>;

const ProcessArticleOutputSchema = z.object({
  rewrittenTitle: z.string().describe('The rewritten, original title for the article.'),
  rewrittenContent: z.string().describe('The rewritten, original content of the article.'),
  generatedImageUrl: z.string().describe('A data URI of the newly generated image for the article.'),
});
export type ProcessArticleOutput = z.infer<typeof ProcessArticleOutputSchema>;


export async function processArticle(input: ProcessArticleInput): Promise<ProcessArticleOutput> {
  return processArticleFlow(input);
}

const rewritePrompt = ai.definePrompt({
    name: 'rewriteArticlePrompt',
    input: { schema: z.object({ title: z.string(), content: z.string() }) },
    output: { schema: z.object({ rewrittenTitle: z.string(), rewrittenContent: z.string() }) },
    prompt: `You are an expert news editor and journalist for a high-traffic online publication focused on cryptocurrency. 
    Your task is to take an existing article and completely rewrite it to be original, insightful, and engaging for a savvy audience.
    
    1.  **Rewrite the Title**: Create a new, compelling, and SEO-friendly title. It should capture the essence of the article but be entirely your own words.
    2.  **Rewrite the Content**: Rephrase, restructure, and add your own insights to the article content. Do not just summarize. The goal is to produce a unique piece of journalism that passes plagiarism checks. The rewritten content should be comprehensive, well-structured, and at least 4 paragraphs long.
    
    Original Title: {{{title}}}
    
    Original Content:
    {{{content}}}
    `,
    model: gpt4o,
});


const processArticleFlow = ai.defineFlow(
  {
    name: 'processArticleFlow',
    inputSchema: ProcessArticleInputSchema,
    outputSchema: ProcessArticleOutputSchema,
  },
  async (input) => {
    
    // Step 1: Rewrite the article title and content
    const rewriteResult = await rewritePrompt(input);
    const { rewrittenTitle, rewrittenContent } = rewriteResult.output!;

    // Step 2: Generate a new image based on the new title
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a visually striking, abstract, and modern image that represents the following theme from a news article: "${rewrittenTitle}". The image should be suitable for a technology or finance blog. Do not include any text in the image.`,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });
    
    return {
      rewrittenTitle,
      rewrittenContent,
      generatedImageUrl: media.url,
    };
  }
);
