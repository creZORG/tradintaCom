'use server';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import { startOfDay, subDays, getDay } from 'date-fns';

customInitApp();
const db = getFirestore();

interface AnalyticsParams {
  leaderboardLimit?: number;
}

export async function getPointsAnalytics(params: AnalyticsParams) {
    const leaderboardLimit = params.leaderboardLimit || 10;

    const [totalPoints, totalUsersWithPoints, topEarners, pointsByDay, pointsByReason] = await Promise.all([
        getTotalPointsAwarded(),
        getTotalUsersWithPoints(),
        getTopEarners(leaderboardLimit),
        getPointsByDayOfWeek(),
        getPointsByReason(),
    ]);

    return {
        totalPoints,
        totalUsersWithPoints,
        topEarners,
        pointsByDay,
        pointsByReason,
    };
}

async function getTotalPointsAwarded(): Promise<number> {
    const snapshot = await db.collection('pointsLedgerEvents').get();
    if (snapshot.empty) return 0;
    return snapshot.docs.reduce((sum, doc) => sum + (doc.data().points || 0), 0);
}

async function getTotalUsersWithPoints(): Promise<number> {
    const snapshot = await db.collection('pointsLedgerEvents').select('user_id').get();
    if (snapshot.empty) return 0;
    const userIds = new Set(snapshot.docs.map(doc => doc.data().user_id));
    return userIds.size;
}

async function getTopEarners(limit: number): Promise<{ userId: string; fullName: string; totalPoints: number }[]> {
    const eventsSnapshot = await db.collection('pointsLedgerEvents').select('user_id', 'points').get();
    if (eventsSnapshot.empty) return [];

    const userPoints: Record<string, number> = {};
    eventsSnapshot.forEach(doc => {
        const { user_id, points } = doc.data();
        if (user_id) {
            userPoints[user_id] = (userPoints[user_id] || 0) + points;
        }
    });

    const sortedUsers = Object.entries(userPoints)
        .map(([userId, totalPoints]) => ({ userId, totalPoints }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit);

    // Fetch user names for the top earners
    const userPromises = sortedUsers.map(async (user) => {
        const userDoc = await db.collection('users').doc(user.userId).get();
        return {
            ...user,
            fullName: userDoc.data()?.fullName || 'Unnamed User',
        };
    });

    return Promise.all(userPromises);
}

async function getPointsByDayOfWeek(): Promise<{ day: string; points: number }[]> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const pointsByDay: { [key: string]: number } = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    
    const sevenDaysAgo = subDays(new Date(), 7);
    const startTimestamp = Timestamp.fromDate(sevenDaysAgo);

    const snapshot = await db.collection('pointsLedgerEvents')
        .where('created_at', '>=', startTimestamp)
        .get();

    snapshot.forEach(doc => {
        const data = doc.data();
        const date = (data.created_at as Timestamp).toDate();
        const dayIndex = getDay(date);
        const dayName = days[dayIndex];
        pointsByDay[dayName] = (pointsByDay[dayName] || 0) + data.points;
    });

    return Object.entries(pointsByDay).map(([day, points]) => ({ day, points }));
}

async function getPointsByReason(): Promise<{ reason: string; points: number }[]> {
    const snapshot = await db.collection('pointsLedgerEvents').select('reason_code', 'points').get();
    if (snapshot.empty) return [];

    const reasonCounts: Record<string, number> = {};
    snapshot.forEach(doc => {
        const { reason_code, points } = doc.data();
        if (reason_code) {
            const formattedReason = reason_code.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            reasonCounts[formattedReason] = (reasonCounts[formattedReason] || 0) + points;
        }
    });

    return Object.entries(reasonCounts)
        .map(([reason, points]) => ({ reason, points }))
        .sort((a, b) => b.points - a.points);
}
