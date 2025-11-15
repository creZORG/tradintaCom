'use server';

import { z } from 'zod';
import { generateProductMetadata } from '@/ai/flows/smart-product-tagging';

const FormSchema = z.object({
  productName: z.string().min(1, 'Product name is required.'),
  productDetails: z.string().min(10, 'Product details must be at least 10 characters long.'),
});

export type AIFormState = {
  message: string;
  productName?: string;
  productDetails?: string;
  output?: {
    tags: string[];
    description: string;
  } | null;
  errors?: {
    productName?: string[];
    productDetails?: string[];
  } | null;
};

export async function getAITagsAndDescription(
  prevState: AIFormState,
  formData: FormData
): Promise<AIFormState> {
  const validatedFields = FormSchema.safeParse({
    productName: formData.get('productName'),
    productDetails: formData.get('productDetails'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check your inputs.',
      errors: validatedFields.error.flatten().fieldErrors,
      output: null,
    };
  }
  
  const { productName, productDetails } = validatedFields.data;

  try {
    const output = await generateProductMetadata({ productName, productDetails });
    return {
      message: 'Successfully generated metadata!',
      productName,
      productDetails,
      output,
      errors: null,
    };
  } catch (e) {
    console.error(e);
    return {
      message: 'An error occurred while generating metadata. Please try again.',
      productName,
      productDetails,
      output: null,
      errors: null,
    };
  }
}
