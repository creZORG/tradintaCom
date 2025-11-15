
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedSealProps {
  className?: string;
  size?: number; // width and height
}

const SEAL_URL = "https://res.cloudinary.com/dlmvoo4fj/image/upload/v1762976664/nubdjwggtr3oz1c5jg7f.png";

export function VerifiedSeal({ className, size = 20 }: VerifiedSealProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative", className)} style={{ width: size, height: size }}>
            <Image
              src={SEAL_URL}
              alt="Tradinta Verified Manufacturer"
              fill
              className="object-contain"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tradinta Verified Manufacturer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
