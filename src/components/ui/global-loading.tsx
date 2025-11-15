'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/logo';
import { Loader } from 'lucide-react';

const facts = [
    "Africa is home to over 1.3 billion people, representing about 17% of the world's population.",
    "The African Continental Free Trade Area (AfCFTA) is the largest free trade area in the world by the number of participating countries.",
    "Nigeria has the largest economy in Africa, followed by South Africa and Egypt.",
    "Manufacturing in Africa is projected to double in size to nearly $1 trillion by 2025.",
    "Intra-African trade currently accounts for only about 17% of total African exports, presenting a huge opportunity for growth.",
    "The informal sector accounts for over 80% of employment in many African countries.",
    "Mobile money adoption in Sub-Saharan Africa is the highest in the world."
];

export function GlobalLoading() {
  const [fact, setFact] = useState<string>('');

  useEffect(() => {
    // Set a random fact on mount, only on the client
    setFact(facts[Math.floor(Math.random() * facts.length)]);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center text-center p-8">
        <Logo className="w-48 mb-8" />
        <Loader className="h-10 w-10 text-primary animate-spin mb-6" />
        <p className="text-lg font-semibold text-muted-foreground max-w-md">
          {fact ? `Did you know? ${fact}` : 'Loading your Tradinta experience...'}
        </p>
      </div>
    </div>
  );
}
