
'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type LogoProps = {
  className?: string;
  wordmarkUrl?: string | null;
  logomarkUrl?: string | null;
  use?: 'wordmark' | 'logomark' | 'responsive';
}

const HARDCODED_LOGO_URL = "https://res.cloudinary.com/dlmvoo4fj/image/upload/v1763394761/zfgb4rehcasjxhv3imxn.png";

export function Logo({ className, use = 'wordmark' }: LogoProps) {
  
  if (use === 'responsive') {
    return (
       <Link href="/" className={cn("relative h-10 w-32", className)}>
        <Image
          src={HARDCODED_LOGO_URL}
          alt="Tradinta Logo"
          width={128}
          height={40}
          className="object-contain hidden md:block"
          priority
        />
         <Image
          src={HARDCODED_LOGO_URL}
          alt="Tradinta Logo"
          width={40}
          height={40}
          className="object-contain block md:hidden"
          priority
        />
      </Link>
    )
  }

  const alt = `Tradinta ${use === 'logomark' ? 'Logomark' : 'Logo'}`;

  return (
    <Link href="/" className={cn("relative h-10 w-32", className)}>
      <Image
        src={HARDCODED_LOGO_URL}
        alt={alt}
        fill
        className="object-contain"
        priority
      />
    </Link>
  );
}
