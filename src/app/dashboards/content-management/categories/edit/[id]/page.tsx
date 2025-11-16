
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ChevronLeft, Trash } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductCategories, type ProductCategory } from '@/app/lib/data';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export default function EditCategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = params.id as string;
    const { toast } = useToast();
    const firestore = useFirestore();

    const [isSaving, setIsSaving] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    
    const categoryDocRef = useMemoFirebase(() => {
        if (!firestore || !categoryId) return null;
        return doc(firestore, 'productCategories', categoryId);
    }, [firestore, categoryId]);

    const { data: category, isLoading, forceRefetch } = useDoc<ProductCategory>(categoryDocRef);
    
    const [name, setName] = React.useState('');
    const [displayOrder, setDisplayOrder] = React.useState(0);
    const [subcategories, setSubcategories] = React.useState('');
    const [imageUrl, setImageUrl] = React.useState('');
    const [imageHint, setImageHint] = React.useState('');

    React.useEffect(() => {
        if (category) {
            setName(category.name || '');
            setDisplayOrder(category.displayOrder || 0);
            setSubcategories(category.subcategories?.join(', ') || '');
            setImageUrl(category.imageUrl || '');
            setImageHint(category.imageHint || '');
        }
    }, [category]);

    const handleSave = async () => {
        if (!categoryDocRef || !name) {
            toast({ title: "Category name is required", variant: "destructive"});
            return;
        }
        setIsSaving(true);
        try {
             const subcategoriesArray = subcategories.split(',').map(s => s.trim()).filter(Boolean);
            await setDoc(categoryDocRef, { 
                name,
                displayOrder: Number(displayOrder),
                subcategories: subcategoriesArray,
                imageUrl,
                imageHint,
            }, { merge: true });
            toast({
                title: "Category Updated",
                description: `The "${category?.name}" category has been updated.`,
            });
            forceRefetch();
            router.push('/dashboards/content-management?tab=categories');
        } catch (error: any) {
            toast({ title: 'Error saving category', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!categoryDocRef) return;
        setIsDeleting(true);
        try {
            await deleteDoc(categoryDocRef);
            toast({ title: 'Category Deleted', description: `The category "${category?.name}" has been permanently deleted.`, variant: 'destructive'});
            router.push('/dashboards/content-management?tab=categories');
        } catch (error: any) {
            toast({ title: 'Error deleting category', description: error.message, variant: 'destructive' });
            setIsDeleting(false);
        }
    }

    if (isLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

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
                    Edit Category
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and will permanently delete this category.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>Update the details for this product category.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="name">Category Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
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
                            <PhotoUpload 
                                label="Upload a new image"
                                initialUrl={imageUrl}
                                onUpload={setImageUrl}
                            />
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
    );
}
