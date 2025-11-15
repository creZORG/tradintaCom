
'use server';
/**
 * @fileOverview An AI flow for generating newsletter content.
 *
 * This flow uses a tool to fetch top-ranked sponsored products from the DiscoveryEngine
 * and then generates engaging marketing copy for them, suitable for an email newsletter.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getRankedProducts, type ProductWithRanking } from '@/services/DiscoveryEngine';
import { type NewsletterContentOutput } from './newsletter-content-flow.d';

// Zod schema for output validation - kept in the .ts file
const NewsletterContentOutputSchema = z.object({
  subjectLine: z.string().describe('An engaging subject line for the email newsletter.'),
  introduction: z.string().describe('A brief, friendly introduction for the newsletter.'),
  productFeatures: z.array(z.object({
    productName: z.string().describe('The name of the featured product.'),
    generatedCopy: z.string().describe('Compelling marketing copy for this product (2-3 sentences).'),
    callToAction: z.string().describe('A call-to-action phrase for this product.'),
  })).describe('A list of featured products with their generated marketing copy.'),
  closing: z.string().describe('A concluding paragraph for the newsletter.'),
});


// Define a tool that allows the AI to fetch top products.
const getTopSponsoredProductsTool = ai.defineTool(
  {
    name: 'getTopSponsoredProducts',
    description: 'Fetches a list of the top-ranked sponsored products suitable for featuring in a newsletter.',
    inputSchema: z.object({
        count: z.number().describe('The number of top products to fetch. Default is 4.'),
    }),
    outputSchema: z.array(z.object({
        name: z.string(),
        description: z.string(),
        manufacturerName: z.string(),
    })),
  },
  async (input) => {
    console.log(`[getTopSponsoredProductsTool] Fetching ${input.count} products.`);
    const allProducts = await getRankedProducts(null); // Pass null for userId to get general ranking
    const sponsoredProducts = allProducts.filter(p => p.isSponsored);
    
    return sponsoredProducts.slice(0, input.count).map(p => ({
        name: p.name,
        description: p.description,
        manufacturerName: p.manufacturerName || 'Tradinta Seller',
    }));
  }
);


// Define the main prompt that uses the tool
const newsletterPrompt = ai.definePrompt({
    name: 'newsletterPrompt',
    input: { schema: z.object({ topic: z.string() }) },
    output: { schema: NewsletterContentOutputSchema },
    tools: [getTopSponsoredProductsTool],
    prompt: `You are an expert marketing copywriter for Tradinta, an African B2B marketplace. Your task is to generate compelling content for our weekly newsletter.

The user wants a newsletter about: {{{topic}}}

First, use the 'getTopSponsoredProducts' tool to fetch a list of our top 4 currently sponsored products.

Then, write the newsletter content. The tone should be professional, exciting, and encouraging for B2B buyers.

- Create a catchy subject line.
- Write a short, engaging introduction.
- For each product returned by the tool, write 2-3 sentences of persuasive marketing copy. Highlight the value and quality.
- Create a simple call-to-action for each product (e.g., "Request a Quote Now", "View Details").
- Write a brief closing paragraph.
`,
});

// Define the flow that orchestrates the process
const generateNewsletterContentFlow = ai.defineFlow(
  {
    name: 'generateNewsletterContentFlow',
    inputSchema: z.object({ topic: z.string() }),
    outputSchema: NewsletterContentOutputSchema,
  },
  async (input) => {
    const llmResponse = await newsletterPrompt(input);
    return llmResponse.output!;
  }
);

// Define the exported server action
export async function generateNewsletterContent(topic: string): Promise<NewsletterContentOutput> {
    return generateNewsletterContentFlow({ topic });
}
