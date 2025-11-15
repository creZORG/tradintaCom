
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils';
import { nanoid } from 'nanoid';


export default function NewCategoryPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [name, setName] = React.useState('');
    const [displayOrder, setDisplayOrder] = React.useState(0);
    const [subcategories, setSubcategories] = React.useState('');
    const [imageUrl, setImageUrl] = React.useState('');
    const [imageHint, setImageHint] = React.useState('');
    
    const [isSaving, setIsSaving] = React.useState(false);
    
    const handleSave = async () => {
        if (!firestore || !name) {
            toast({ title: "Category name is required.", variant: 'destructive'});
            return;
        }
        setIsSaving(true);
        try {
            const categoryId = generateSlug(name);
            const subcategoriesArray = subcategories.split(',').map(s => s.trim()).filter(Boolean);

            await setDoc(doc(firestore, 'productCategories', categoryId), {
                id: categoryId,
                name: name,
                displayOrder: Number(displayOrder),
                subcategories: subcategoriesArray,
                imageUrl: imageUrl,
                imageHint: imageHint,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: 'New category created.' });
            router.push('/dashboards/content-management?tab=categories');
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to create category.', variant: 'destructive' });
            console.error(e);
        }
        setIsSaving(false);
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
                    Add New Category
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboards/content-management?tab=categories')}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Category
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                    <CardDescription>Set the details for the new product category.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="name">Category Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Chemicals" />
                        </div>
                         <div className="grid gap-3">
                            <Label htmlFor="order">Display Order</Label>
                            <Input id="order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
                        </div>
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="subcategories">Subcategories</Label>
                        <Textarea id="subcategories" value={subcategories} onChange={e => setSubcategories(e.target.value)} placeholder="Enter comma-separated values, e.g., Solvents, Acids, Bases" />
                    </div>
                     <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label>Category Image</Label>
                            <PhotoUpload label="Upload an image for the category" onUpload={setImageUrl} initialUrl={imageUrl} />
                        </div>
                        <div className="grid gap-3">
                             <Label htmlFor="imageHint">Image AI Hint</Label>
                             <Input id="imageHint" value={imageHint} onChange={e => setImageHint(e.target.value)} placeholder="e.g., chemical factory" />
                             <p className="text-xs text-muted-foreground">A 1-2 word hint for AI image search if no image is uploaded.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
