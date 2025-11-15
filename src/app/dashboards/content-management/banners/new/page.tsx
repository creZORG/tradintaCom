
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Save,
  Loader2,
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
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';


export default function NewBannerPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [title, setTitle] = React.useState('');
    const [subtitle, setSubtitle] = React.useState('');
    const [imageUrl, setImageUrl] = React.useState('');
    const [link, setLink] = React.useState('');
    const [status, setStatus] = React.useState<'draft' | 'published'>('draft');
    const [order, setOrder] = React.useState(0);

    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            await addDoc(collection(firestore, 'homepageBanners'), {
                id: nanoid(),
                title,
                subtitle,
                imageUrl,
                link,
                status,
                order: Number(order)
            });
            toast({ title: 'Success', description: 'New banner created.' });
            router.push('/dashboards/content-management');
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to create banner.', variant: 'destructive' });
            console.error(e);
        }
        setIsSaving(false);
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
                    Add New Banner
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboards/content-management')}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Banner
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Banner Details</CardTitle>
                    <CardDescription>Set the content and settings for the new banner.</CardDescription>
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
