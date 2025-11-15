
'use server';

import { getDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  const linkId = params.linkId;
  if (!linkId) {
    return new NextResponse('Link ID is missing', { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    // Fallback redirect if DB is not available
    return NextResponse.redirect(new URL('/', request.url));
  }

  const linkRef = db.collection('shortlinks').doc(linkId);

  try {
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      // If link doesn't exist, redirect to a fallback page
      return NextResponse.redirect(new URL('/not-found', request.url));
    }

    const linkData = linkDoc.data();
    const destinationUrl = linkData?.destinationUrl;

    if (!destinationUrl) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // --- Start background tasks (don't await) ---
    const backgroundTasks = async () => {
      try {
        // Increment click count
        await linkRef.update({ clickCount: FieldValue.increment(1) });
        
        // Log the click event
        await db.collection('linkClicks').add({
          id: nanoid(),
          referrerId: linkData.partnerId,
          shortLinkId: linkId,
          targetUrl: destinationUrl,
          timestamp: FieldValue.serverTimestamp(),
          userAgent: request.headers.get('user-agent') || '',
          campaign: linkData.campaign || null,
        });
      } catch (err) {
        // Log errors but don't block the user's redirect
        console.error('Error during shortlink background tasks:', err);
      }
    };
    backgroundTasks();
    // --- End background tasks ---

    // Set a cookie to track the referral for attribution, readable by the client
    if (linkData.partnerId) {
        cookies().set('referralCode', linkData.partnerId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            httpOnly: false, // Allows client-side script to read it
            sameSite: 'lax',
        });
    }

    // Redirect the user to the final destination
    return NextResponse.redirect(new URL(destinationUrl, request.url));

  } catch (error) {
    console.error(`Error processing shortlink ${linkId}:`, error);
    // Redirect to a fallback page in case of any error
    return NextResponse.redirect(new URL('/', request.url));
  }
}
