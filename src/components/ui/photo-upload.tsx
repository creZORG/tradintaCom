
'use client';

import * as React from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from './button';
import { Label } from '@/components/ui/label';

interface PhotoUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onUpload: (url: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  initialUrl?: string | null;
  label?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const PhotoUpload = React.forwardRef<HTMLDivElement, PhotoUploadProps>(
  ({ onUpload, onLoadingChange, initialUrl, label, disabled = false, children, className, ...props }, ref) => {
    const [preview, setPreview] = React.useState<string | null>(initialUrl || null);
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();
    
    React.useEffect(() => {
        setPreview(initialUrl || null);
    }, [initialUrl]);
    
    const setLoading = (loading: boolean) => {
      setIsLoading(loading);
      onLoadingChange?.(loading);
    }

    const handleUpload = async (base64Data: string, file: File) => {
      if (!base64Data) return;
      setLoading(true);

      try {
        const paramsToSign = {
          timestamp: Math.round(new Date().getTime() / 1000),
        };

        const signatureResponse = await fetch('/api/sign-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paramsToSign }),
        });

        const { signature } = await signatureResponse.json();

        if (!signature) {
          throw new Error('Failed to get a signature for the upload.');
        }

        const formData = new FormData();
        formData.append('file', base64Data);
        formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
        formData.append('signature', signature);
        formData.append('timestamp', paramsToSign.timestamp.toString());

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data?.error?.message || 'Upload failed due to an unknown error.';
          throw new Error(errorMessage);
        }
        
        onUpload(data.secure_url);
        setPreview(data.secure_url);

        toast({
          title: 'Upload Successful',
          description: `${file.name} has been uploaded.`,
        });

      } catch (error: any) {
        console.error('Detailed upload error:', error);
        toast({
          title: 'Upload Failed',
          description: error.message || 'Something went wrong. Please check the console for details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    const onDrop = React.useCallback(
      (acceptedFiles: File[]) => {
        if (disabled) return;
        if (acceptedFiles.length > 0) {
          const selectedFile = acceptedFiles[0];
          
          const reader = new FileReader();
          reader.onload = (e) => {
              const base64String = e.target?.result as string;
              setPreview(base64String); // Show local preview immediately
              handleUpload(base64String, selectedFile); // Upload to Cloudinary
          };
          reader.readAsDataURL(selectedFile);
        }
      },
      [disabled]
    );


    const removeImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(disabled) return;
      setPreview(null);
      onUpload('');
    }

    const dropzoneOptions: DropzoneOptions = {
      onDrop,
      accept: { 'image/*': ['.jpeg', '.jpg', '.png'], 'application/pdf': ['.pdf'] },
      multiple: false,
      disabled: disabled,
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

    if (children) {
      return (
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          {children}
        </div>
      );
    }
    
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
         {label && <Label className={cn(disabled && "text-muted-foreground")}>{label}</Label>}
        <div
            {...getRootProps()}
            className={cn(
              'relative group flex aspect-square w-full rounded-md border-2 border-dashed items-center justify-center text-center',
              disabled ? 'cursor-not-allowed bg-muted/50 opacity-70' : 'cursor-pointer',
              isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
            )}
        >
             <input {...getInputProps()} />
             {preview ? (
                 <>
                    <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-contain rounded-md p-2"
                    />
                     {!disabled && (
                        <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {isLoading ? (
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                            ) : (
                            <Button variant="destructive" size="icon" onClick={removeImage} type="button">
                                <X className="h-5 w-5" />
                            </Button>
                            )}
                        </div>
                    )}
                 </>
             ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                    <>
                    <Upload className="h-8 w-8" />
                    <p className="text-sm px-2">{disabled ? 'Uploading disabled' : 'Drag & drop or click to upload'}</p>
                    </>
                )}
                </div>
             )}
        </div>
      </div>
    );
  }
);

PhotoUpload.displayName = 'PhotoUpload';

export { PhotoUpload };
