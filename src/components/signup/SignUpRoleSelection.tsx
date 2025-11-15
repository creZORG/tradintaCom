
'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ShoppingCart,
  Factory,
  Handshake as HandshakeIcon,
} from 'lucide-react';

interface SignUpRoleSelectionProps {
  role: string;
  onRoleChange: (role: string) => void;
}

export function SignUpRoleSelection({ role, onRoleChange }: SignUpRoleSelectionProps) {
  return (
    <RadioGroup
      defaultValue="buyer"
      className="grid grid-cols-1 gap-4"
      onValueChange={onRoleChange}
      value={role}
    >
      <Label
        htmlFor="buyer"
        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
      >
        <RadioGroupItem value="buyer" id="buyer" className="sr-only" />
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <ShoppingCart className="mb-0 h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">I am a Buyer</span>
          </div>
          <div className="w-6 h-6 rounded-full border border-primary flex items-center justify-center peer-data-[state=checked]:bg-primary">
            <div className="w-3 h-3 rounded-full bg-background peer-data-[state=checked]:bg-primary-foreground"></div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2 w-full text-left">
          Source products, request quotes, and purchase directly from
          manufacturers.
        </p>
      </Label>
      <div className="grid grid-cols-2 gap-4">
        <Label
          htmlFor="manufacturer"
          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
        >
          <RadioGroupItem
            value="manufacturer"
            id="manufacturer"
            className="sr-only"
          />
          <Factory className="mb-3 h-6 w-6" />
          Manufacturer
        </Label>
        <Label
          htmlFor="partner"
          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
        >
          <RadioGroupItem value="partner" id="partner" className="sr-only" />
          <HandshakeIcon className="mb-3 h-6 w-6" />
          Influencer
        </Label>
      </div>
    </RadioGroup>
  );
}
