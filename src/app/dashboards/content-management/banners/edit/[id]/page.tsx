
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Save,
  Loader2,
  Trash,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhotoUpload } from '@/components/photo-upload';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


type BannerData = {
    title: string;
    subtitle: string;
    imageUrl: string;
    link: string;
    status: 'draft' | 'published';
    order: number;
};

export default function EditBannerPage() {
    const params = useParams();
    const router = useRouter();
    const bannerId = params.id as string;
    const firestore = useFirestore();
    const { toast } = useToast();

    const bannerDocRef = useMemoFirebase(() => {
        if (!firestore || !bannerId) return null;
        return doc(firestore, 'homepageBanners', bannerId);
    }, [firestore, bannerId]);
    
    const { data: banner, isLoading: isBannerLoading } = useDoc<BannerData>(bannerDocRef);

    const [title, setTitle] = React.useState('');
    const [subtitle, setSubtitle] = React.useState('');
    const [imageUrl, setImageUrl] = React.useState('');
    const [link, setLink] = React.useState('');
    const [status, setStatus] = React.useState<'draft' | 'published'>('draft');
    const [order, setOrder] = React.useState(0);

    const [isSaving, setIsSaving] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        if (banner) {
            setTitle(banner.title || '');
            setSubtitle(banner.subtitle || '');
            setImageUrl(banner.imageUrl || '');
            setLink(banner.link || '');
            setStatus(banner.status || 'draft');
            setOrder(banner.order || 0);
        }
    }, [banner]);

    const handleSave = async () => {
        if (!bannerDocRef) return;
        setIsSaving(true);
        try {
            await updateDoc(bannerDocRef, {
                title,
                subtitle,
                imageUrl,
                link,
                status,
                order: Number(order)
            });
            toast({ title: 'Success', description: 'Banner updated successfully.' });
            router.push('/dashboards/content-management');
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to update banner.', variant: 'destructive' });
            console.error(e);
        }
        setIsSaving(false);
    }
    
    const handleDelete = async () => {
        if (!bannerDocRef) return;
        setIsDeleting(true);
        try {
            await deleteDoc(bannerDocRef);
            toast({ title: 'Success', description: 'Banner has been deleted.' });
            router.push('/dashboards/content-management');
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to delete banner.', variant: 'destructive' });
            console.error(e);
            setIsDeleting(false);
        }
    }


    if (isBannerLoading) {
        return <Skeleton className="w-full h-96" />;
    }

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/content-management">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit Banner
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
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the banner.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
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
                    <CardTitle>Banner Details</CardTitle>
                    <CardDescription>Update the content and settings for this banner.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="subtitle">Subtitle (optional)</Label>
                            <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                        </div>
                         <div className="grid gap-3">
                            <Label htmlFor="link">Link URL</Label>
                            <Input id="link" placeholder="/products" value={link} onChange={(e) => setLink(e.target.value)} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="order">Display Order</Label>
                            <Input id="order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={(v: 'draft' | 'published') => setStatus(v)}>
                                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid gap-3">
                        <Label>Banner Image</Label>
                        <PhotoUpload label="Upload an image for the banner background" onUpload={setImageUrl} initialUrl={imageUrl} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
