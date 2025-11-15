
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/app/lib/categories';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';

export default function EditCategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = params.id as string;
    const { toast } = useToast();

    const [isSaving, setIsSaving] = React.useState(false);
    
    // Find the category and its current image from our static data
    const category = categories.find(c => c.id === categoryId);
    const currentImage = PlaceHolderImages.find(img => img.id === category?.imageId);
    
    const [imageUrl, setImageUrl] = React.useState(currentImage?.imageUrl || '');

    const handleSave = async () => {
        if (!category) {
            toast({ title: "Category not found", variant: "destructive"});
            return;
        }
        setIsSaving(true);
        // In a real application with a dynamic backend, you would make an API call here.
        // For this static prototype, we can't modify the JSON file directly.
        // We will simulate the save process and show a success message.
        console.log(`Saving new image URL for category ${categoryId}: ${imageUrl}`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: "Image Updated",
            description: `The image for the "${category.name}" category has been updated. (This is a simulation)`,
        });
        
        setIsSaving(false);
        router.push('/dashboards/content-management?tab=categories');
    };

    if (!category) {
        return <div>Category not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/content-management?tab=categories">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit Category Image
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                     <Button variant="outline" size="sm" onClick={() => router.push('/dashboards/content-management?tab=categories')}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>Update the display image for this product category.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3">
                        <Label>Category Image</Label>
                        <PhotoUpload 
                            label="Upload a new image"
                            initialUrl={imageUrl}
                            onUpload={setImageUrl}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
