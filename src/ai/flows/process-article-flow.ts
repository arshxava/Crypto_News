
'use server';

/**
 * @fileOverview An AI flow for processing news articles.
 * It rewrites the content and title to be original and generates a new image.
 *
 * - processArticle - A function that processes a given article.
 * - ProcessArticleInput - The input type for the processArticle function.
 * - ProcessArticleOutput - The return type for the processArticle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProcessArticleInputSchema = z.object({
  title: z.string().describe('The original title of the article.'),
  content: z.string().describe('The original content of the article.'),
});
export type ProcessArticleInput = z.infer<typeof ProcessArticleInputSchema>;


const ArticleRewriteSchema = z.object({
    rewrittenTitle: z.string().describe("The rewritten, original, and SEO-friendly title for the article. It should capture the essence of the article but be entirely new words."),
    rewrittenContent: z.string().describe("The rewritten, comprehensive, well-structured, and original article content. It should be at least 4 paragraphs long and pass plagiarism checks."),
});

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
    input: { schema: ProcessArticleInputSchema },
    output: { schema: ArticleRewriteSchema },
    prompt: `You are an expert news editor and journalist for a high-traffic online publication focused on cryptocurrency. 
Your task is to take an existing article and completely rewrite it to be original, insightful, and engaging for a savvy audience.
Do not just summarize. The goal is to produce a unique piece of journalism.

Original Title: {{{title}}}
Original Content: {{{content}}}
`,
});


const processArticleFlow = ai.defineFlow(
  {
    name: 'processArticleFlow',
    inputSchema: ProcessArticleInputSchema,
    outputSchema: ProcessArticleOutputSchema,
  },
  async (input) => {
    
    console.log(`[AI] Starting to process article: "${input.title}"`);

    const { output: rewriteOutput } = await rewritePrompt(input);
    
    if (!rewriteOutput) {
        console.error("Failed to rewrite article, AI returned empty output.");
        throw new Error("Failed to rewrite article content.");
    }
    
    console.log(`[AI] Successfully rewritten title: "${rewriteOutput.rewrittenTitle}"`);
    console.log('[AI] Calling Google AI to generate image...');
    
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a visually striking, abstract, and modern image that represents the following theme from a news article: "${rewriteOutput.rewrittenTitle}". The image should be suitable for a technology or finance blog. Do not include any text in the image.`,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });
    
    console.log('[AI] Successfully generated image.');

    return {
      rewrittenTitle: rewriteOutput.rewrittenTitle,
      rewrittenContent: rewriteOutput.rewrittenContent,
      generatedImageUrl: media.url,
    };
  }
);
