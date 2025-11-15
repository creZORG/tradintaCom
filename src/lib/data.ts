
'use server';
import { getDb } from '@/lib/firebase-admin';
import { type Product, type Manufacturer } from './definitions';

const db = getDb();

// Define types for our data
type HomepageBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  author: string;
  content: string;
  publishedAt: any;
};

type BrandingLogos = {
    tradintaDirectLogoUrl?: string;
    theFoundryLogoUrl?: string;
}

export type ProductCategory = {
  id: string;
  name: string;
  subcategories: string[];
  imageUrl: string;
  imageHint: string;
  displayOrder: number;
}

/**
 * Fetches published homepage banners from Firestore, ordered by the 'order' field.
 * This function runs on the server and uses the Admin SDK, bypassing security rules.
 */
export async function getHomepageBanners(): Promise<HomepageBanner[]> {
  if (!db) return [];
  try {
    const bannersSnapshot = await db
      .collection('homepageBanners')
      .where('status', '==', 'published')
      .orderBy('order', 'asc')
      .get();

    if (bannersSnapshot.empty) {
      return [];
    }

    return bannersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as HomepageBanner));
  } catch (error) {
    console.error("Error fetching homepage banners:", error);
    // In a real application, you might want to log this to a proper logging service.
    // For now, we return an empty array to prevent the page from crashing.
    return [];
  }
}

/**
 * Fetches all published blog posts from Firestore.
 * This function runs on the server and uses the Admin SDK, bypassing security rules.
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
    if (!db) return [];
    try {
        const postsSnapshot = await db
            .collection('blogPosts')
            .where('status', '==', 'published')
            .orderBy('publishedAt', 'desc')
            .get();

        if (postsSnapshot.empty) {
            return [];
        }

        return postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BlogPost));

    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return [];
    }
}

/**
 * Fetches a single blog post by its slug.
 * This function runs on the server and uses the Admin SDK.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!db) return null;
    try {
        const postQuery = db.collection('blogPosts').where('slug', '==', slug).limit(1);
        const querySnapshot = await postQuery.get();

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as BlogPost;
    } catch (error) {
        console.error(`Error fetching blog post by slug (${slug}):`, error);
        return null;
    }
}

export async function getBrandingLogos(): Promise<BrandingLogos> {
    if (!db) return {};
    try {
        const settingsDoc = await db.collection('platformSettings').doc('config').get();
        if (!settingsDoc.exists) {
            return {};
        }
        const settingsData = settingsDoc.data();
        return settingsData?.branding || {};
    } catch (error) {
        console.error("Error fetching branding logos:", error);
        return {};
    }
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  if (!db) return [];
  try {
    const snapshot = await db.collection('productCategories').orderBy('displayOrder', 'asc').get();
    if(snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => doc.data() as ProductCategory);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }
}

// This function is now DEPRECATED as all product fetching should go through the DiscoveryEngine.
// It is kept for reference but should not be used in new code.
export async function getAllProducts(): Promise<any[]> {
    console.warn("DEPRECATED: getAllProducts in lib/data.ts should not be used. Use services/DiscoveryEngine instead.");
    return [];
}
