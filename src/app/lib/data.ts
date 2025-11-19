
'use server';
import { getDb } from '@/lib/firebase-admin';
import { type Product, type Manufacturer } from './definitions';
import { cache } from 'react';
import { Timestamp } from 'firebase-admin/firestore';

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

type JobOpening = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  status: 'Open' | 'Closed';
  createdAt: any;
}

type BrandingLogos = {
    wordmarkUrl?: string;
    logomarkUrl?: string;
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
  createdAt?: any;
}

/**
 * Fetches published homepage banners from Firestore, ordered by the 'order' field.
 * This function runs on the server and uses the Admin SDK, bypassing security rules.
 * Wrapped in React.cache to memoize results for the duration of a request.
 */
export const getHomepageBanners = cache(async (): Promise<HomepageBanner[]> => {
  const db = await getDb();
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
    return [];
  }
});

/**
 * Fetches all published blog posts from Firestore.
 * This function runs on the server and uses the Admin SDK, bypassing security rules.
 * Wrapped in React.cache to memoize results.
 */
export const getAllBlogPosts = cache(async (): Promise<BlogPost[]> => {
    const db = await getDb();
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
});

/**
 * Fetches a single blog post by its slug.
 * This function is cached to prevent multiple fetches for the same slug within a single request.
 */
export const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
    const db = await getDb();
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
});

/**
 * Fetches branding logos from Firestore.
 * This function is cached as branding logos are requested in multiple places (layout, components).
 */
export const getBrandingLogos = cache(async (): Promise<BrandingLogos> => {
    const db = await getDb();
    if (!db) return { wordmarkUrl: '', logomarkUrl: '' };
    try {
        const settingsDoc = await db.collection('platformSettings').doc('config').get();
        if (!settingsDoc.exists) {
            return { wordmarkUrl: '', logomarkUrl: '' };
        }
        const settingsData = settingsDoc.data();
        return settingsData?.branding || { wordmarkUrl: '', logomarkUrl: '' };
    } catch (error) {
        console.error("Error fetching branding logos:", error);
        return { wordmarkUrl: '', logomarkUrl: '' };
    }
});

/**
 * Fetches all product categories from Firestore.
 * This function is cached as categories are used on multiple pages.
 */
export const getProductCategories = cache(async (): Promise<ProductCategory[]> => {
  const db = await getDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection('productCategories').orderBy('displayOrder', 'asc').get();
    if(snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const plainData: any = {};
        for (const key in data) {
            const value = data[key];
            if (value instanceof Timestamp) {
                plainData[key] = value.toDate().toISOString();
            } else {
                plainData[key] = value;
            }
        }
        return plainData as ProductCategory;
    });
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }
});

/**
 * Fetches a single product category by its ID (slug).
 * This function is cached.
 */
export const getCategoryBySlug = cache(async (slug: string): Promise<ProductCategory | null> => {
    const db = await getDb();
    if (!db) return null;
    try {
        const docRef = db.collection('productCategories').doc(slug);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data();
        const plainData: any = {};
        for (const key in data) {
            const value = data[key];
            if (value instanceof Timestamp) {
                plainData[key] = value.toDate().toISOString();
            } else {
                plainData[key] = value;
            }
        }
        return plainData as ProductCategory;
    } catch (error) {
        console.error(`Error fetching category by slug (${slug}):`, error);
        return null;
    }
});


/**
 * Fetches all open job openings from Firestore.
 * This function is cached to speed up the careers page.
 */
export const getAllJobOpenings = cache(async (): Promise<JobOpening[]> => {
    const db = await getDb();
    if (!db) return [];
    try {
        const snapshot = await db.collection('jobOpenings').where('status', '==', 'Open').orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as JobOpening));
    } catch (error) {
        console.error("Error fetching job openings:", error);
        return [];
    }
});

/**
 * Fetches a single job opening by its slug.
 * This function is cached to speed up individual job posting pages.
 */
export const getJobOpeningBySlug = cache(async (slug: string): Promise<JobOpening | null> => {
    const db = await getDb();
    if (!db) return null;
    try {
        const q = db.collection('jobOpenings').where('slug', '==', slug).limit(1);
        const snapshot = await q.get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as JobOpening;
    } catch (error) {
        console.error(`Error fetching job by slug (${slug}):`, error);
        return null;
    }
});

/**
 * Fetches the background images for the login and signup pages.
 * It checks for manual overrides in the AdSlots collection.
 */
export const getAuthPageImages = cache(async (): Promise<{ loginImageUrl: string, signupImageUrl: string }> => {
  const db = await getDb();
  if (!db) return { loginImageUrl: '', signupImageUrl: '' };

  const defaultLoginImg = 'https://picsum.photos/seed/login-bg/1200/800';
  const defaultSignupImg = 'https://picsum.photos/seed/signup-new/1200/1800';

  try {
    const loginSlotRef = db.collection('adSlots').doc('auth-login-background');
    const signupSlotRef = db.collection('adSlots').doc('auth-signup-background');

    const [loginDoc, signupDoc] = await Promise.all([loginSlotRef.get(), signupSlotRef.get()]);

    const loginImageUrl = loginDoc.exists ? loginDoc.data()?.imageUrl || defaultLoginImg : defaultLoginImg;
    const signupImageUrl = signupDoc.exists ? signupDoc.data()?.imageUrl || defaultSignupImg : defaultSignupImg;

    return { loginImageUrl, signupImageUrl };

  } catch (error) {
    console.error("Error fetching auth page images:", error);
    return { loginImageUrl: defaultLoginImg, signupImageUrl: defaultSignupImg };
  }
});


// This function is now DEPRECATED as all product fetching should go through the DiscoveryEngine.
// It is kept for reference but should not be used in new code.
export async function getAllProducts(): Promise<any[]> {
    console.warn("DEPRECATED: getAllProducts in lib/data.ts should not be used. Use services/DiscoveryEngine instead.");
    return [];
}
