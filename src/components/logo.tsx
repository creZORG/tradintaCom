
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

const defaultWordmark = "https://res.cloudinary.com/dlmvoo4fj/image/upload/v1763113453/nygbverafbjxgcu2604c.png";
const defaultLogomark = "https://res.cloudinary.com/dlmvoo4fj/image/upload/v1763113614/ybfdmvcyfjrdhdghnxrx.png";

export function Logo({ className, wordmarkUrl, logomarkUrl, use = 'wordmark' }: LogoProps) {
  
  const finalWordmark = wordmarkUrl || defaultWordmark;
  const finalLogomark = logomarkUrl || defaultLogomark;

  if (use === 'responsive') {
    return (
       <Link href="/" className={cn("relative h-10 w-32", className)}>
        <Image
          src={finalWordmark}
          alt="Tradinta Logo"
          width={128}
          height={40}
          className="object-contain hidden md:block"
          priority
        />
         <Image
          src={finalLogomark}
          alt="Tradinta Logo"
          width={40}
          height={40}
          className="object-contain block md:hidden"
          priority
        />
      </Link>
    )
  }

  const src = use === 'logomark' ? finalLogomark : finalWordmark;
  const alt = `Tradinta ${use === 'logomark' ? 'Logomark' : 'Logo'}`;

  return (
    <Link href="/" className={cn("relative h-10 w-32", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        priority
      />
    </Link>
  );
}
