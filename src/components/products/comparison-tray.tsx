
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCompareStore } from '@/hooks/use-compare-store';
import { Button } from '../ui/button';
import { X, Layers } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '../ui/toast';


export function ComparisonTray() {
  const { items, removeItem, clear } = useCompareStore();
  const [isVisible, setIsVisible] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Use an effect to manage visibility with a delay, making the animation smoother.
  React.useEffect(() => {
    if (items.length > 0) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow for the slide-out animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

  if (!isVisible && items.length === 0) {
    return null;
  }

  const compareUrl = `/compare?ids=${items.map(item => item.id).join(',')}`;
  
  const handleCompareClick = () => {
    if (items.length < 2) {
      toast({
        title: "Need more items to compare",
        description: "Please select at least two products to see a comparison.",
        action: (
            <div className="flex gap-2">
                 <ToastAction altText="Clear" onClick={() => clear()}>Clear</ToastAction>
                 <ToastAction altText="Continue">Continue</ToastAction>
            </div>
        ),
      });
    } else {
      router.push(compareUrl);
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-in-out",
        items.length > 0 ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="bg-background border-t border-x rounded-t-lg shadow-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <TooltipProvider>
                <div className="flex -space-x-4">
                {items.map((item, index) => (
                    <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                            <div className="relative h-12 w-12 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden shadow-md group" style={{ zIndex: items.length - index }}>
                                <Image src={item.imageUrl || 'https://placehold.co/48x48'} alt={item.name} fill className="object-cover" />
                                <button onClick={() => removeItem(item.id)} className="absolute top-0 right-0 -mr-1 -mt-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="h-3 w-3"/>
                                </button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>{item.name}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
                </div>
            </TooltipProvider>
            {items.length > 0 && <span className="font-semibold text-sm">{items.length} of 4 items selected</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={clear}>Clear All</Button>
            <Button onClick={handleCompareClick}>
                <Layers className="mr-2 h-4 w-4" /> Compare Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
