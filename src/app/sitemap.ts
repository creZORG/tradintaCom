
import { MetadataRoute } from 'next';
import { getDb } from '@/lib/firebase-admin';
import type { Product, Manufacturer, BlogPost } from '@/lib/definitions';

const BASE_URL = 'https://www.tradinta.com'; // In production, this should come from an environment variable

async function fetchCollection(collectionName: string): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];
    try {
        const snapshot = await db.collection(collectionName).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return [];
    }
}

async function fetchCollectionGroup(collectionName: string): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];
    try {
        const snapshot = await db.collectionGroup(collectionName).get();
        // We need to get manufacturer slug for product URLs
        const products = await Promise.all(snapshot.docs.map(async (doc) => {
            const productData = doc.data();
            const manufacturerRef = doc.ref.parent.parent;
            if (!manufacturerRef) return null;

            const manufacturerSnap = await manufacturerRef.get();
            const manufacturerData = manufacturerSnap.data() as Manufacturer | undefined;
            
            return {
                ...productData,
                id: doc.id,
                slug: productData.slug,
                manufacturerSlug: manufacturerData?.slug,
                updatedAt: productData.updatedAt?.toDate() || new Date(),
            };
        }));
        return products.filter(p => p !== null);
    } catch (error) {
        console.error(`Error fetching collection group ${collectionName}:`, error);
        return [];
    }
}


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static pages
  const staticRoutes = [
    '',
    '/products',
    '/blog',
    '/foundry',
    '/marketing-plans',
    '/tradepay/about',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Dynamic Manufacturer (Shop) pages
  const manufacturers = await fetchCollection('manufacturers') as Manufacturer[];
  const manufacturerRoutes = manufacturers
    .filter(m => m.slug) // Only include manufacturers that have a slug
    .map((manufacturer) => ({
      url: `${BASE_URL}/manufacturer/${manufacturer.slug}`,
      lastModified: new Date(), // Ideally, you'd use an `updatedAt` timestamp from the document
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // 3. Dynamic Product pages
  const products = await fetchCollectionGroup('products') as any[];
  const productRoutes = products
    .filter(p => p.slug && p.manufacturerSlug && p.status === 'published')
    .map((product) => ({
      url: `${BASE_URL}/products/${product.manufacturerSlug}/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
    
  // 4. Dynamic Blog pages
  const blogPosts = await fetchCollection('blogPosts') as BlogPost[];
  const blogRoutes = blogPosts
    .filter(p => p.slug && p.status === 'published')
    .map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt.toDate()),
        changeFrequency: 'monthly' as const,
        priority: 0.5
    }));


  return [...staticRoutes, ...manufacturerRoutes, ...productRoutes, ...blogRoutes];
}
