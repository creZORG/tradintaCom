
'use server';

/**
 * @fileoverview This service handles backend document processing and verification logic.
 * It includes logic for OCR simulation and real file deletion from Cloudinary.
 */

import { getDb } from '@/lib/firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
// This ensures that the SDK is ready to make API calls.
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}


/**
 * Simulates scanning an ID document image, extracting the ID number, and returning a redacted version.
 * @param imageUrl The URL of the ID document to scan.
 * @returns A promise that resolves to a redacted ID string (e.g., "12***789").
 */
export async function scanAndRedactId(imageUrl: string): Promise<string> {
  // In a real application, this function would:
  // 1. Download the image from the URL.
  // 2. Use a cloud OCR service (like Google Cloud Vision API) to extract text.
  // 3. Use regular expressions to find a Kenyan ID number pattern (e.g., 7-8 digits).
  // 4. If found, redact it, keeping the first few and last few digits.
  // 5. Return the redacted string.
  
  console.log(`[VerificationService] Simulating OCR scan for: ${imageUrl}`);

  // For this prototype, we return a plausible-looking fake redacted ID.
  const fakeId = Math.floor(10000000 + Math.random() * 90000000).toString();
  const redactedId = `${fakeId.substring(0, 2)}***${fakeId.substring(fakeId.length - 3)}`;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return redactedId;
}

/**
 * Simulates the verification of a legal document (e.g., Certificate of Incorporation).
 * @param documentUrl The URL of the document to verify.
 * @returns A promise that resolves to an object indicating if the document is valid.
 */
export async function verifyDocument(documentUrl: string): Promise<{ isValid: boolean; details?: string }> {
  // A real implementation would:
  // 1. Potentially use OCR to extract key information (registration number, company name).
  // 2. Cross-reference this information with a government business registry API.
  // 3. Return a validity status based on the API response.

  console.log(`[VerificationService] Simulating verification for document: ${documentUrl}`);
  
  // Simulate a successful verification for this prototype.
  return { isValid: true };
}

/**
 * Deletes the original document from the Cloudinary storage bucket.
 * This is a critical security step.
 * @param fileUrl The URL of the file to delete.
 */
export async function deleteOriginalDocument(fileUrl: string): Promise<void> {
  if (!process.env.CLOUDINARY_URL) {
    console.warn('[VerificationService] Cloudinary URL not configured. Skipping file deletion.');
    return;
  }
  
  if (!fileUrl) {
    console.warn('[VerificationService] No file URL provided for deletion.');
    return;
  }

  try {
    // Extract the public_id from the full Cloudinary URL.
    // e.g., https://res.cloudinary.com/demo/image/upload/v1588628089/sample.jpg -> sample
    const publicIdWithFolder = fileUrl.split('/').pop()?.split('.')[0];
    if (!publicIdWithFolder) {
      throw new Error('Could not extract public_id from URL');
    }

    console.log(`[VerificationService] Deleting file from Cloudinary with public_id: ${publicIdWithFolder}`);

    // Use the Cloudinary Admin SDK to destroy the image.
    const result = await cloudinary.uploader.destroy(publicIdWithFolder);

    if (result.result !== 'ok') {
        // This case handles situations where Cloudinary confirms the request but can't find the file (e.g., already deleted).
        // We can treat 'not found' as a success for our workflow.
        if(result.result !== 'not found') {
            throw new Error(`Cloudinary deletion failed: ${result.result}`);
        }
    }
    
    console.log(`[VerificationService] Successfully processed deletion for public_id: ${publicIdWithFolder}`);

  } catch (error) {
    console.error('Error deleting original document from Cloudinary:', error);
    // In a production environment, you might want to log this to a monitoring service.
    // We re-throw the error so the calling function knows the deletion failed.
    throw error;
  }
}
