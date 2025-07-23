
'use server';

/**
 * @fileOverview A Genkit flow for processing news articles.
 * It rewrites the content to be original and generates a new image.
 *
 * - processArticle - A function that processes a given article.
 * - ProcessArticleInput - The input type for the processArticle function.
 * - ProcessArticleOutput - The return type for the processArticle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import sharp from 'sharp';

const ProcessArticleInputSchema = z.object({
  title: z.string().describe('The title of the article.'),
  content: z.string().describe('The content of the article.'),
});
export type ProcessArticleInput = z.infer<typeof ProcessArticleInputSchema>;

const ProcessArticleOutputSchema = z.object({
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
    output: { schema: z.object({ rewrittenContent: z.string() }) },
    prompt: `You are a professional news editor. Rewrite the following article to be unique, engaging, and suitable for a modern audience interested in cryptocurrency. 
    Do not just summarize, but instead rephrase and restructure the content to make it original.
    
    Title: {{{title}}}
    
    Original Content:
    {{{content}}}
    
    Your rewritten content should be at least 3 paragraphs long.
    `,
});

const generateImageFlow = ai.defineFlow(
    {
      name: 'generateArticleImageFlow',
      inputSchema: z.object({ title: z.string() }),
      outputSchema: z.string(),
    },
    async ({ title }) => {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `Generate a visually striking, abstract, and modern image that represents the following theme from a news article: "${title}". The image should be suitable for a technology or finance blog. Do not include any text in the image.`,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        const imageUri = media.url;
        
        // Resize and compress the image
        const base64Data = imageUri.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        const compressedImageBuffer = await sharp(imageBuffer)
            .resize(600, 400, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

        return `data:image/jpeg;base64,${compressedImageBuffer.toString('base64')}`;
    }
);


const processArticleFlow = ai.defineFlow(
  {
    name: 'processArticleFlow',
    inputSchema: ProcessArticleInputSchema,
    outputSchema: ProcessArticleOutputSchema,
  },
  async (input) => {
    
    // Run content rewriting and image generation in parallel
    const [rewriteResult, imageResult] = await Promise.all([
        rewritePrompt(input),
        generateImageFlow({ title: input.title }),
    ]);
    
    return {
      rewrittenContent: rewriteResult.output!.rewrittenContent,
      generatedImageUrl: imageResult,
    };
  }
);
