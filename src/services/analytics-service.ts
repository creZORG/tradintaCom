
'use server';

import { getDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, startOfDay } from 'date-fns';

type SearchTerm = {
    term: string;
    count: number;
};

/**
 * Fetches the top 10 most popular search queries over a given period.
 *
 * @param period - The time frame to analyze ('daily', 'weekly', 'monthly').
 * @returns A promise that resolves to an array of top search terms.
 */
export async function getTopSearches(period: 'daily' | 'weekly' | 'monthly'): Promise<SearchTerm[]> {
    const db = await getDb();
    if (!db) {
        console.error("Firestore not available in analytics-service.");
        return [];
    }

    try {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'daily':
                startDate = startOfDay(now);
                break;
            case 'weekly':
                startDate = subDays(now, 7);
                break;
            case 'monthly':
                startDate = subDays(now, 30);
                break;
            default:
                startDate = subDays(now, 7);
        }

        const startTimestamp = Timestamp.fromDate(startDate);
        
        const usageQuery = db.collection('featureUsage')
            .where('feature', '==', 'product:search')
            .where('timestamp', '>=', startTimestamp);

        const snapshot = await usageQuery.get();

        if (snapshot.empty) {
            return [];
        }

        const termCounts: Record<string, number> = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const term = data.metadata?.query?.trim().toLowerCase();
            if (term) {
                termCounts[term] = (termCounts[term] || 0) + 1;
            }
        });

        const sortedTerms = Object.entries(termCounts)
            .map(([term, count]) => ({ term, count }))
            .sort((a, b) => b.count - a.count);

        return sortedTerms.slice(0, 10);

    } catch (error) {
        console.error(`Error fetching top ${period} searches:`, error);
        // In a real app, you might want more sophisticated error logging.
        return [];
    }
}
