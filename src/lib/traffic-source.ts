
'use client';

/**
 * Determines the traffic source based on the document's referrer.
 * This is a client-side utility because it needs access to `document.referrer`.
 * 
 * @param referrer - The string from `document.referrer`.
 * @returns A categorized traffic source name (e.g., 'Google', 'Facebook', 'Direct').
 */
export function getTrafficSource(referrer: string): string {
  if (!referrer) {
    return 'Direct';
  }

  try {
    const referrerUrl = new URL(referrer);
    const hostname = referrerUrl.hostname;
    
    // Check if the referral is from the same domain (internal navigation)
    if (hostname === window.location.hostname) {
        return 'Internal';
    }

    if (hostname.includes('google.')) return 'Google';
    if (hostname.includes('facebook.')) return 'Facebook';
    if (hostname.includes('instagram.')) return 'Instagram';
    if (hostname.includes('twitter.') || hostname === 't.co') return 'X (Twitter)';
    if (hostname.includes('linkedin.')) return 'LinkedIn';
    if (hostname.includes('youtube.')) return 'YouTube';
    if (hostname.includes('bing.')) return 'Bing';
    if (hostname.includes('yahoo.')) return 'Yahoo';
    if (hostname.includes('duckduckgo.')) return 'DuckDuckGo';

    // If it's not a known search engine or social media, return the hostname.
    // This will capture referrals from other websites.
    return hostname;

  } catch (error) {
    // If the referrer is not a valid URL (e.g., from a mobile app),
    // it might be 'android-app://...' or similar. We can just return it as is.
    return referrer || 'Unknown';
  }
}
