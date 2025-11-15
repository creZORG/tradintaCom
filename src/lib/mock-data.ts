

import type { Product, Order, Campaign, Manufacturer } from './definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// This file is being deprecated. All dynamic data should be fetched from Firestore
// via server-side services (e.g., in /services). Mock data is unreliable and
// does not reflect the dynamic nature of the application.

export const manufacturers: Manufacturer[] = [];
export const products: Product[] = [];
export const orders: Order[] = [];
export const campaigns: Campaign[] = [];
