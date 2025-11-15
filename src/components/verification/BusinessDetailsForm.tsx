
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Building, Phone, MapPin } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { VerificationFormData } from '@/app/dashboards/seller-centre/verification/page';

interface BusinessDetailsFormProps {
  disabled?: boolean;
}

export function BusinessDetailsForm({ disabled = false }: BusinessDetailsFormProps) {
  const { control, formState: { errors } } = useFormContext<VerificationFormData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" /> Business Information
        </CardTitle>
        <CardDescription>Provide the legal details of your company.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="shopName" className={disabled ? 'text-muted-foreground' : ''}>Business Name</Label>
          <Controller
            name="shopName"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input {...field} id="shopName" className="pl-9" placeholder="Your registered company name" disabled={disabled} />
              </div>
            )}
          />
          {errors.shopName && <p className="text-xs text-destructive">{errors.shopName.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ownerName" className={disabled ? 'text-muted-foreground' : ''}>Owner/Representative Name</Label>
           <Controller
            name="ownerName"
            control={control}
            render={({ field }) => (
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input {...field} id="ownerName" className="pl-9" placeholder="e.g., John Doe" disabled={disabled} />
                </div>
            )}
          />
          {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
        </div>
         <div className="grid gap-2">
          <Label htmlFor="phone" className={disabled ? 'text-muted-foreground' : ''}>Business Phone Number</Label>
           <Controller
            name="phone"
            control={control}
            render={({ field }) => (
                <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input {...field} id="phone" type="tel" className="pl-9" placeholder="e.g., 0712345678" disabled={disabled} />
                </div>
            )}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
         <div className="grid gap-2">
          <Label htmlFor="address" className={disabled ? 'text-muted-foreground' : ''}>Physical Address</Label>
           <Controller
            name="address"
            control={control}
            render={({ field }) => (
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input {...field} id="address" className="pl-9" placeholder="Building, Street, Town" disabled={disabled} />
                </div>
            )}
          />
           {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
