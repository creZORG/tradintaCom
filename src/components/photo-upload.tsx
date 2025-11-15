
'use client';

import * as React from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from './ui/button';
import { Label } from '@/components/ui/label';

interface PhotoUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onUpload: (url: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  initialUrl?: string | null;
  label: string;
}

const PhotoUpload = React.forwardRef<HTMLDivElement, PhotoUploadProps>(
  ({ onUpload, onLoadingChange, initialUrl, label, className, ...props }, ref) => {
    const [file, setFile] = React.useState<File | null>(null);
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

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        const previewUrl = URL.createObjectURL(selectedFile);
        setPreview(previewUrl);
        // Automatically start the upload process
        handleUpload(selectedFile);
      }
    }, []);

    const handleUpload = async (fileToUpload: File) => {
      if (!fileToUpload) return;
      setLoading(true);

      try {
        // 1. Get signature from our new API route
        const paramsToSign = {
          timestamp: Math.round(new Date().getTime() / 1000),
          // Add any other parameters you want to sign here, e.g., folder
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

        // 2. Prepare form data for Cloudinary
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
        formData.append('signature', signature);
        formData.append('timestamp', paramsToSign.timestamp.toString());
        // You can add folder parameter here if you want:
        // formData.append('folder', 'shop_assets');

        // 3. Make the upload request to Cloudinary
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
        toast({
          title: 'Upload Successful',
          description: `${fileToUpload.name} has been uploaded.`,
        });
        setFile(null); // Clear file after successful upload

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


    const removeImage = () => {
      setFile(null);
      setPreview(null);
      onUpload('');
    }

    const dropzoneOptions: DropzoneOptions = {
      onDrop,
      accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
      multiple: false,
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
         <Label>{label}</Label>
        {preview ? (
          <div className="relative group aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
             <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain rounded-md"
              />
            <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Button variant="destructive" size="icon" onClick={removeImage} type="button">
                      <X className="h-5 w-5" />
                  </Button>
                )}
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={cn(
              'flex aspect-video w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed text-center',
              isDragActive ? 'border-primary bg-primary/10' : 'hover:bg-muted'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">Drag & drop or click to upload</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

PhotoUpload.displayName = 'PhotoUpload';

export { PhotoUpload };
