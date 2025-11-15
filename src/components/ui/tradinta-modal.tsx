'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Logo } from '../logo';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface TradintaModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showLogo?: boolean;
  className?: string;
}

export function TradintaModal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  showLogo = true,
  className,
}: TradintaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn('sm:max-w-[425px]', className)}>
        <DialogHeader className="text-center items-center">
          {showLogo && <Logo className="w-24 mb-4" />}
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="py-4">{children}</div>

        {footer && (
            <DialogFooter>
                {footer}
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Example of how to use the cancel button in the footer
export const ModalCancelButton = () => (
    <DialogClose asChild>
        <Button type="button" variant="secondary">
            Cancel
        </Button>
    </DialogClose>
);
