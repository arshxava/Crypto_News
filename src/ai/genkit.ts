import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkit/x/openai';

export const ai = genkit({
  plugins: [
    googleAI(),
    // To use OpenAI, make sure you have the OPENAI_API_KEY environment variable set.
    process.env.OPENAI_API_KEY ? openAI() : null,
  ],
  model: 'googleai/gemini-2.0-flash',
});
