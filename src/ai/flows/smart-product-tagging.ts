'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating product tags and descriptions using AI.
 *
 * The flow takes a product name and details as input and returns AI-generated tags and a description.
 * This helps manufacturers to improve the discoverability of their products on the Tradinta platform.
 *
 * @exports generateProductMetadata - The main function to trigger the flow.
 * @exports SmartProductTaggingInput - The input type for the flow.
 * @exports SmartProductTaggingOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartProductTaggingInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDetails: z.string().describe('Detailed information about the product.'),
});
export type SmartProductTaggingInput = z.infer<typeof SmartProductTaggingInputSchema>;

const SmartProductTaggingOutputSchema = z.object({
  tags: z.array(z.string()).describe('AI-generated tags for the product.'),
  description: z.string().describe('AI-generated description for the product.'),
});
export type SmartProductTaggingOutput = z.infer<typeof SmartProductTaggingOutputSchema>;

export async function generateProductMetadata(
  input: SmartProductTaggingInput
): Promise<SmartProductTaggingOutput> {
  return smartProductTaggingFlow(input);
}

const smartProductTaggingPrompt = ai.definePrompt({
  name: 'smartProductTaggingPrompt',
  input: {schema: SmartProductTaggingInputSchema},
  output: {schema: SmartProductTaggingOutputSchema},
  prompt: `You are an AI assistant helping manufacturers generate product tags and descriptions for their products.

  Generate relevant tags and a concise description based on the product name and details provided.

  Product Name: {{{productName}}}
  Product Details: {{{productDetails}}}

  Output the generated tags as an array of strings and the description as a single string.

  Here's an example of the output format:
  {
    "tags": ["tag1", "tag2", "tag3"],
    "description": "A concise description of the product."
  }
  `,
});

const smartProductTaggingFlow = ai.defineFlow(
  {
    name: 'smartProductTaggingFlow',
    inputSchema: SmartProductTaggingInputSchema,
    outputSchema: SmartProductTaggingOutputSchema,
  },
  async input => {
    const {output} = await smartProductTaggingPrompt(input);
    return output!;
  }
);
