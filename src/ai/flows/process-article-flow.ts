
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
import { z } from 'zod';
import OpenAI from 'openai';


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
    
    // Step 1: Rewrite the article title and content using OpenAI
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    let rewrittenTitle = '';
    let rewrittenContent = '';

    try {
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: `You are an expert news editor and journalist for a high-traffic online publication focused on cryptocurrency. 
Your task is to take an existing article and completely rewrite it to be original, insightful, and engaging for a savvy audience.
Respond with a JSON object with two keys: "rewrittenTitle" and "rewrittenContent".

1.  **Rewrite the Title**: Create a new, compelling, and SEO-friendly title. It should capture the essence of the article but be entirely your own words.
2.  **Rewrite the Content**: Rephrase, restructure, and add your own insights to the article content. Do not just summarize. The goal is to produce a unique piece of journalism that passes plagiarism checks. The rewritten content should be comprehensive, well-structured, and at least 4 paragraphs long.`},
                { role: 'user', content: `Original Title: ${input.title}\n\nOriginal Content:\n${input.content}` }
            ],
            model: 'gpt-4o',
            response_format: { type: "json_object" },
        });
        
        const responseContent = chatCompletion.choices[0].message.content;

        if (responseContent) {
            const responseJson = JSON.parse(responseContent);
            rewrittenTitle = responseJson.rewrittenTitle;
            rewrittenContent = responseJson.rewrittenContent;
        } else {
            throw new Error("OpenAI returned an empty response.");
        }

    } catch (e: any) {
        console.error("Error processing article with OpenAI:", e.message);
        console.error("Raw OpenAI response that caused error:", e.response?.data);
        // Re-throw the error to be caught by the caller in actions.ts
        throw new Error(`Failed to process article content with OpenAI: ${e.message}`);
    }


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
