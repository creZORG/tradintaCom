
'use server';

import { getDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { serverTimestamp } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';

/**
 * DEPRECATED: This route is being replaced by the /l/[linkId] route.
 * It is kept for backward compatibility with old links but new links
 * should be generated via the shortlink service.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const referrerId = searchParams.get('ref');
  const targetUrl = searchParams.get('url');

  if (!referrerId || !targetUrl) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl.toString(), 307);
  }

  try {
    const db = await getDb();
    if (db) {
        db.collection('linkClicks').add({
            id: nanoid(),
            referrerId,
            targetUrl,
            timestamp: serverTimestamp(),
            userAgent: request.headers.get('user-agent') || '',
        }).catch(console.error);
    }
  } catch (error) {
    console.error('Error logging referral click:', error);
  }

  // The destination URL is now correctly constructed from the targetUrl which is a relative path.
  const destinationUrl = new URL(targetUrl, request.url);
  
  if (!destinationUrl.searchParams.has('ref')) {
      destinationUrl.searchParams.set('ref', referrerId);
  }
  
  const response = NextResponse.redirect(destinationUrl.toString(), 307);

  cookies().set('referralCode', referrerId, { 
      path: '/', 
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: 'lax',
  });

  return response;
}
