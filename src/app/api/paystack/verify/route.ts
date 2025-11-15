

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { awardPoints } from '@/lib/points';
import { sendPaymentReceiptEmail, sendSellerPaymentNotificationEmail } from '@/app/lib/actions/auth';
import { headers } from 'next/headers';

// Initialize Firebase Admin SDK
customInitApp();
const db = getFirestore();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper to find partner campaign and calculate commission
async function getCommissionDetails(partnerId: string, sellerId: string): Promise<{ commissionRate: number; campaignId: string | null }> {
    // For now, using a default commission.
    // In a real scenario, this would query a 'growthPartnerCampaigns' collection
    // to find an active campaign between the partner and seller.
    const defaultCommissionRate = 5; // 5%
    return { commissionRate: defaultCommissionRate, campaignId: 'default-campaign' };
}

export async function POST(request: NextRequest) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('Paystack secret key is not configured.');
    return NextResponse.json({ error: 'Internal server error: Payment gateway not configured.' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = headers().get('x-paystack-signature');

  // CRITICAL FIX: Verify the webhook signature
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(rawBody, 'utf-8')
    .digest('hex');
  
  if (hash !== signature) {
    console.warn('Invalid Paystack webhook signature received.');
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }


  try {
    const body = JSON.parse(rawBody); // Now we can safely parse the JSON
    const { event, data: eventData } = body;

    // Only process successful charges. Other events can be handled as needed.
    if (event !== 'charge.success') {
      return NextResponse.json({ success: true, message: 'Webhook received but not a success event.' });
    }
    
    const { reference, metadata } = eventData;
    const { orderId, planId, durationInMonths = 1, isPartialPayment = false } = metadata;


    // Verify transaction with Paystack first for all flows
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const data = await paystackResponse.json();

    if (!paystackResponse.ok || !data.status) {
        return NextResponse.json({ error: 'Payment verification failed.', details: data.message }, { status: 400 });
    }
    
    const paymentData = data.data;

    // --- Subscription Logic ---
    if (planId && reference) {
      if (paymentData.status !== 'success') {
          return NextResponse.json({ error: 'Payment for subscription has not completed.', details: paymentData.gateway_response }, { status: 400 });
      }

      const userId = paymentData.metadata.userId;
      if (!userId) {
          return NextResponse.json({ error: 'User ID missing from payment metadata.' }, { status: 400 });
      }

      const sellerRef = db.collection('manufacturers').doc(userId);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationInMonths);

      await sellerRef.update({
          marketingPlanId: planId,
          planExpiresAt: Timestamp.fromDate(expiresAt)
      });
      
      const successUrl = new URL('/subscribe/success', request.url);
      successUrl.searchParams.set('planId', planId);
      return NextResponse.redirect(successUrl.toString());
    }

    // --- Order Payment Logic ---
    if (!reference || !orderId) {
      return NextResponse.json({ error: 'Missing required payment information.' }, { status: 400 });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const paymentRef = db.collection('payments').doc();
    const paidAmount = paymentData.amount / 100;
    
    // Check for existing payment to prevent duplicates
    const existingPaymentQuery = db.collection('payments').where('reference', '==', reference).limit(1);
    const existingPaymentSnap = await existingPaymentQuery.get();
    if (!existingPaymentSnap.empty) {
        console.log(`Payment with reference ${reference} has already been processed.`);
        return NextResponse.json({ success: true, message: 'Payment previously verified.' });
    }

    // Create the payment record regardless of status to log the attempt
    await paymentRef.set({
      orderId: orderId,
      buyerId: paymentData.metadata.buyerId,
      paymentDate: Timestamp.now(),
      amount: paidAmount,
      paymentMethod: `Paystack - ${paymentData.channel}`,
      transactionId: paymentData.id.toString(),
      reference: reference,
      status: paymentData.status === 'success' ? 'Completed' : 'Failed',
      gatewayResponse: paymentData.gateway_response,
    });
    
    // If payment failed, stop here.
    if (paymentData.status !== 'success') {
       return NextResponse.json({ error: 'Payment was not successful.', details: paymentData.gateway_response }, { status: 400 });
    }

    const { buyerId, buyerName, buyerEmail, sellerId, sellerName, sellerEmail, orderSubtotal, orderAmount, orderItems, isOrderFullyPaid } = await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error('Order not found.');
      }
      const orderData = orderDoc.data()!;

      // CRITICAL FIX: Verify that the paid amount matches the order total for non-partial payments
      if (!isPartialPayment && Math.round(paidAmount) < Math.round(orderData.totalAmount)) {
          throw new Error(`Payment amount mismatch. Paid: ${paidAmount}, Required: ${orderData.totalAmount}`);
      }

      const newAmountPaid = (orderData.amountPaid || 0) + paidAmount;
      const newBalanceDue = orderData.totalAmount - newAmountPaid;
      const isFullyPaid = newBalanceDue <= 0;
      let newStatus = orderData.status;

      if (isFullyPaid) {
          newStatus = 'Processing';
      } else if (isPartialPayment) {
          newStatus = 'Processing'; // Or a custom 'Partially Paid' status
      }
      
      transaction.update(orderRef, { 
          status: newStatus,
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
      });

      const buyerDoc = await db.collection('users').doc(orderData.buyerId).get();
      const sellerDoc = await db.collection('manufacturers').doc(orderData.sellerId).get();

      return { 
          buyerId: orderData.buyerId,
          buyerName: buyerDoc.data()?.fullName || 'Valued Customer',
          buyerEmail: buyerDoc.data()?.email,
          sellerId: orderData.sellerId,
          sellerName: sellerDoc.data()?.shopName || 'Tradinta Seller',
          sellerEmail: sellerDoc.data()?.contactEmail || sellerDoc.data()?.email,
          orderSubtotal: orderData.subtotal,
          orderAmount: orderData.totalAmount, 
          orderItems: orderData.items,
          isOrderFullyPaid: isFullyPaid
      };
    });

    if (!buyerId) {
        return NextResponse.json({ success: true, message: 'Order processing complete, but buyer details not found for post-tasks.' });
    }

    // CRITICAL FIX: Await post-transaction tasks to prevent race conditions
    await (async () => {
        try {
            // Send emails
            if (buyerEmail) {
                await sendPaymentReceiptEmail({
                    to: buyerEmail,
                    buyerName: buyerName,
                    orderId: orderId,
                    items: orderItems,
                    totalAmount: orderAmount,
                    amountPaid: paidAmount,
                    paymentMethod: `Paystack - ${paymentData.channel}`
                });
            }
            if (sellerEmail) {
                await sendSellerPaymentNotificationEmail({
                    to: sellerEmail,
                    sellerName: sellerName,
                    orderId: orderId,
                    buyerName: buyerName,
                    amountPaid: paidAmount,
                    totalAmount: orderAmount,
                });
            }

            // CRITICAL FIX: Award points only when the order is fully paid.
            if (isOrderFullyPaid) {
                const pointsConfigSnap = await db.collection('platformSettings').doc('config').get();
                const pointsConfig = pointsConfigSnap.data()?.pointsConfig || {};
                
                // Award points to Buyer based on TOTAL order amount
                const buyerPointsPer10Kes = pointsConfig.buyerPurchasePointsPer10 || 1;
                const buyerPoints = Math.floor((orderAmount / 10) * buyerPointsPer10Kes);
                if (buyerPoints > 0) {
                    await awardPoints(db, buyerId, buyerPoints, 'PURCHASE_COMPLETE', { orderId });
                }
                
                const orderData = (await orderRef.get()).data();
                if (orderData && !orderData.isTradintaDirect) {
                    // Update Seller Earnings
                    const platformFee = orderData.platformFee || 0;
                    const sellerShare = orderData.subtotal - platformFee;
                    if (sellerId && sellerShare > 0) {
                        const sellerEarningsRef = db.collection('sellerEarnings').doc(sellerId);
                        await sellerEarningsRef.set({
                            sellerId,
                            totalEarnings: FieldValue.increment(sellerShare),
                            unpaidEarnings: FieldValue.increment(sellerShare),
                        }, { merge: true });
                    }

                    // Award Points to Seller based on TOTAL order amount
                    const sellerDoc = await db.collection('manufacturers').doc(sellerId).get();
                    const sellerData = sellerDoc.data();
                    const isSellerVerified = sellerData?.verificationStatus === 'Verified';

                    const sellerPointsPer10Kes = pointsConfig.sellerSalePointsPer10 || 1;
                    let sellerPoints = Math.floor((orderAmount / 10) * sellerPointsPer10Kes);
                    
                    if (isSellerVerified && pointsConfig.globalSellerPointMultiplier && pointsConfig.globalSellerPointMultiplier > 1) {
                        sellerPoints *= pointsConfig.globalSellerPointMultiplier;
                    }
                    
                    if (sellerPoints > 0) {
                        await awardPoints(db, sellerId, sellerPoints, 'SALE_COMPLETE', { orderId, buyerId });
                    }
                }
            }
            
            // Attribution Logic
            const referralCode = request.cookies.get('referralCode')?.value;
            if (referralCode && orderItems && orderItems.length > 0) {
                const partnerQuery = await db.collection('users').where('tradintaId', '==', referralCode).limit(1).get();
                if(!partnerQuery.empty) {
                    const partnerId = partnerQuery.docs[0].id;
                    const { commissionRate, campaignId } = await getCommissionDetails(partnerId, sellerId);
                    const commissionEarned = (orderSubtotal * commissionRate) / 100;
                    
                    const saleRef = db.collection('attributedSales').doc();
                    await saleRef.set({
                        id: saleRef.id,
                        orderId,
                        partnerId,
                        campaignId,
                        saleAmount: orderSubtotal,
                        commissionEarned,
                        date: FieldValue.serverTimestamp(),
                        payoutStatus: 'Unpaid',
                    });

                    const earningsRef = db.collection('partnerEarnings').doc(partnerId);
                    await earningsRef.set({
                        partnerId,
                        totalEarnings: FieldValue.increment(commissionEarned),
                        unpaidEarnings: FieldValue.increment(commissionEarned),
                        paidEarnings: FieldValue.increment(0),
                    }, { merge: true });
                }
            }
        } catch (postError) {
            console.error('CRITICAL ERROR in post-transaction tasks:', postError);
            // In a production system, you would trigger an alert here (e.g., to Sentry, PagerDuty).
        }
    })();

    return NextResponse.json({ success: true, message: 'Webhook processed and order updated.' });

  } catch (error: any) {
    console.error('Error in Paystack webhook processing:', error);
    return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
  }
}
