
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, ScanLine } from 'lucide-react';
import { PhotoUpload } from '../ui/photo-upload';
import { useFormContext, Controller } from 'react-hook-form';
import { VerificationFormData } from '@/app/dashboards/seller-centre/verification/page';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface LegalDocumentsFormProps {
  disabled?: boolean;
}

export function LegalDocumentsForm({ disabled = false }: LegalDocumentsFormProps) {
    const { control, setValue, formState: { errors } } = useFormContext<VerificationFormData>();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Legal Documents
                </CardTitle>
                <CardDescription>
                    Upload clear copies of your business registration documents.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="businessLicenseNumber" className={disabled ? 'text-muted-foreground' : ''}>Business Registration No.</Label>
                        <Controller
                            name="businessLicenseNumber"
                            control={control}
                            render={({ field }) => <Input {...field} id="businessLicenseNumber" placeholder="e.g., BN-XYZ123" disabled={disabled} />}
                        />
                         {errors.businessLicenseNumber && <p className="text-xs text-destructive">{errors.businessLicenseNumber.message}</p>}
                    </div>
                    <Controller
                        name="certUrl"
                        control={control}
                        render={({ field }) => (
                            <PhotoUpload
                                label="Certificate of Incorporation"
                                onUpload={(url) => setValue('certUrl', url, { shouldValidate: true })}
                                initialUrl={field.value}
                                disabled={disabled}
                            />
                        )}
                    />
                     {errors.certUrl && <p className="text-xs text-destructive">{errors.certUrl.message}</p>}
                </div>
                 <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="kraPin" className={disabled ? 'text-muted-foreground' : ''}>KRA PIN</Label>
                        <Controller
                            name="kraPin"
                            control={control}
                            render={({ field }) => <Input {...field} id="kraPin" placeholder="e.g., A001234567Z" disabled={disabled} />}
                        />
                         {errors.kraPin && <p className="text-xs text-destructive">{errors.kraPin.message}</p>}
                    </div>
                     <Controller
                        name="kraPinUrl"
                        control={control}
                        render={({ field }) => (
                            <PhotoUpload
                                label="KRA PIN Certificate"
                                onUpload={(url) => setValue('kraPinUrl', url, { shouldValidate: true })}
                                initialUrl={field.value}
                                disabled={disabled}
                            />
                        )}
                    />
                    {errors.kraPinUrl && <p className="text-xs text-destructive">{errors.kraPinUrl.message}</p>}
                </div>
                 <div className="sm:col-span-2 space-y-4 pt-4 border-t">
                    <div className="grid gap-2">
                        <Label className={disabled ? 'text-muted-foreground' : ''}>Owner/Representative ID</Label>
                        <p className="text-xs text-muted-foreground">Upload a clear image of your National ID or Passport. Documents will be deleted after verification.</p>
                    </div>
                    <Controller
                        name="ownerIdUrl"
                        control={control}
                        render={({ field }) => (
                            <div className="max-w-sm">
                                <PhotoUpload
                                    label="National ID or Passport"
                                    onUpload={(url) => setValue('ownerIdUrl', url, { shouldValidate: true })}
                                    initialUrl={field.value}
                                    disabled={disabled}
                                />
                            </div>
                        )}
                    />
                     {errors.ownerIdUrl && <p className="text-xs text-destructive">{errors.ownerIdUrl.message}</p>}
                    <Alert variant="default" className="text-xs">
                        <ScanLine className="h-4 w-4" />
                        <AlertTitle>Your Privacy is Important</AlertTitle>
                        <AlertDescription>
                            Your ID number will be stored in a redacted format for compliance, and the original document file will be permanently deleted after verification.
                        </AlertDescription>
                    </Alert>
                </div>
            </CardContent>
        </Card>
    );
}
