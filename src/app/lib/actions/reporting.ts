
'use server';

import { getDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

type Order = {
    orderDate: Timestamp;
    platformFee?: number;
    processingFee?: number;
    totalAmount: number;
    [key: string]: any;
};

type MarketingPlan = {
    id: string;
    price: number;
};

type Payout = {
    id: string;
    partnerId: string;
    amount: number;
    date: Timestamp;
    status: 'Completed' | 'Failed';
    transactionId?: string;
}

const objectToCsvRow = (obj: Record<string, any>): string => {
    return Object.values(obj).map(value => {
        const strValue = String(value ?? '');
        if (strValue.includes(',')) {
            return `"${strValue}"`;
        }
        return strValue;
    }).join(',');
};

export async function generateRevenueReport(month: string): Promise<string> {
    const db = await getDb();
    const targetDate = parseISO(month);
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    // 1. Fetch orders for the month
    const ordersSnapshot = await db.collection('orders')
        .where('orderDate', '>=', startDate)
        .where('orderDate', '<=', endDate)
        .get();

    let platformFeeRevenue = 0;
    let processingFeeRevenue = 0;
    ordersSnapshot.forEach(doc => {
        const order = doc.data() as Order;
        platformFeeRevenue += order.platformFee || 0;
        processingFeeRevenue += order.processingFee || 0;
    });

    // 2. Fetch marketing plan subscriptions
    const plansSnapshot = await db.collection('marketingPlans').get();
    const plans = new Map<string, MarketingPlan>();
    plansSnapshot.forEach(doc => plans.set(doc.id, doc.data() as MarketingPlan));
    
    const sellersSnapshot = await db.collection('manufacturers').where('marketingPlanId', '!=', null).get();
    let marketingRevenue = 0;
    sellersSnapshot.forEach(doc => {
        const seller = doc.data();
        if (seller.marketingPlanId && plans.has(seller.marketingPlanId)) {
            marketingRevenue += plans.get(seller.marketingPlanId)!.price;
        }
    });

    const totalRevenue = platformFeeRevenue + processingFeeRevenue + marketingRevenue;
    
    const csvHeader = 'Metric,Amount (KES)';
    const csvRows = [
        `Platform Fee Revenue,${platformFeeRevenue.toFixed(2)}`,
        `Processing Fee Revenue,${processingFeeRevenue.toFixed(2)}`,
        `Marketing Subscriptions,${marketingRevenue.toFixed(2)}`,
        `Total Estimated Revenue,${totalRevenue.toFixed(2)}`
    ];

    return [csvHeader, ...csvRows].join('\n');
}

export async function generatePayoutsReport(): Promise<string> {
    const db = await getDb();
    const payoutsSnapshot = await db.collection('payouts').where('status', '==', 'Completed').get();
    
    if (payoutsSnapshot.empty) {
        return 'No completed payouts found.';
    }

    const payouts = payoutsSnapshot.docs.map(doc => doc.data() as Payout);
    const headers = ['Payout ID', 'Date', 'Partner ID', 'Amount (KES)', 'Transaction ID'];
    const rows = payouts.map(p => objectToCsvRow({
        id: p.id,
        date: p.date.toDate().toISOString(),
        partnerId: p.partnerId,
        amount: p.amount,
        transactionId: p.transactionId
    }));

    return [headers.join(','), ...rows].join('\n');
}

export async function generateTransactionLedger(startDateStr: string, endDateStr: string): Promise<string> {
    const db = await getDb();
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    const snapshot = await db.collection('orders')
        .where('orderDate', '>=', startDate)
        .where('orderDate', '<=', endDate)
        .orderBy('orderDate', 'desc')
        .get();

    if (snapshot.empty) {
        return 'No transactions found for the selected period.';
    }

    const orders = snapshot.docs.map(doc => doc.data() as Order);
    const headers = ['Order ID', 'Date', 'Buyer Name', 'Seller Name', 'Subtotal', 'Platform Fee', 'Processing Fee', 'Total Amount', 'Status'];
    const rows = orders.map(o => objectToCsvRow({
        id: o.id,
        date: o.orderDate.toDate().toISOString(),
        buyerName: o.buyerName,
        sellerName: o.sellerName,
        subtotal: o.subtotal,
        platformFee: o.platformFee,
        processingFee: o.processingFee,
        totalAmount: o.totalAmount,
        status: o.status
    }));

    return [headers.join(','), ...rows].join('\n');
}
