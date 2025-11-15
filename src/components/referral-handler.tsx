
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const TRACKING_PARAMS = [
  'ref',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'msclkid',
  'campaign_id',
  'ad_id',
];

export function ReferralHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run this logic on the initial visit if attribution data isn't already set.
    if (localStorage.getItem('attributionData')) {
      return;
    }

    const attributionData: Record<string, string> = {};
    let hasAttributionParams = false;

    for (const param of TRACKING_PARAMS) {
      const value = searchParams.get(param);
      if (value) {
        attributionData[param] = value;
        hasAttributionParams = true;
      }
    }

    if (hasAttributionParams) {
      localStorage.setItem('attributionData', JSON.stringify(attributionData));
    }
  }, [searchParams]);

  // This component renders nothing. Its only purpose is to handle the side effect.
  return null;
}
