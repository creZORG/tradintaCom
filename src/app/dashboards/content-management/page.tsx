
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Settings, Save, Loader2, Copy, Search, ImageIcon } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { ProductCategory } from '@/app/lib/data';
import { getProductCategories } from '@/app/lib/data';
import { Input } from '@/components/ui/input';
import { nanoid } from 'nanoid';
import { ScrollArea } from '@/components/ui/scroll-area';


type HomepageBanner = {
  id: string;
  title: string;
  status: 'draft' | 'published';
  imageUrl: string;
  order: number;
};

type BlogPost = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  author: string;
  publishedAt: any;
};

type SitePage = {
    id: string;
    title: string;
    slug: string;
    lastUpdated: any;
};

type MediaAsset = {
    id: string;
    title?: string;
    imageUrl: string;
    uploadedAt: any;
}

const BrandingTab = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);

    const brandingRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'config') : null, [firestore]);
    const { data: brandingData, isLoading, forceRefetch } = useDoc(brandingRef);

    const [wordmarkUrl, setWordmarkUrl] = React.useState('');
    const [logomarkUrl, setLogomarkUrl] = React.useState('');
    const [directLogoUrl, setDirectLogoUrl] = React.useState('');
    const [foundryLogoUrl, setFoundryLogoUrl] = React.useState('');
    
    React.useEffect(() => {
        if (brandingData?.branding) {
            setWordmarkUrl(brandingData.branding.wordmarkUrl || '');
            setLogomarkUrl(brandingData.branding.logomarkUrl || '');
            setDirectLogoUrl(brandingData.branding.tradintaDirectLogoUrl || '');
            setFoundryLogoUrl(brandingData.branding.theFoundryLogoUrl || '');
        }
    }, [brandingData]);
    
    const handleSaveChanges = async () => {
        if (!brandingRef) return;
        setIsSaving(true);
        try {
            await setDocumentNonBlocking(brandingRef, {
                branding: {
                    wordmarkUrl: wordmarkUrl,
                    logomarkUrl: logomarkUrl,
                    tradintaDirectLogoUrl: directLogoUrl,
                    theFoundryLogoUrl: foundryLogoUrl,
                }
            }, { merge: true });
            toast({ title: "Brand assets saved!" });
            forceRefetch();
        } catch (error: any) {
            toast({ title: "Error saving brand assets", description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return <Skeleton className="h-96" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Branding & Logos</CardTitle>
                <CardDescription>Manage logos for the main site and key platform features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="grid gap-3">
                        <Label>Main Wordmark (Full Logo)</Label>
                        <p className="text-sm text-muted-foreground">The primary logo used in the site header.</p>
                        <PhotoUpload
                            onUpload={setWordmarkUrl}
                            initialUrl={wordmarkUrl || "https://res.cloudinary.com/dlmvoo4fj/image/upload/v1763113453/nygbverafbjxgcu2604c.png"}
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label>Main Logomark (Icon)</Label>
                        <p className="text-sm text-muted-foreground">The small icon used for mobile and avatars.</p>
                        <PhotoUpload
                            onUpload={setLogomarkUrl}
                            initialUrl={logomarkUrl || "https://res.cloudinary.com/dlmvoo4fj/image/upload/v1763113614/ybfdmvcyfjrdhdghnxrx.png"}
                        />
                    </div>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
                    <div className="grid gap-3">
                        <Label>Tradinta Direct Logo</Label>
                        <p className="text-sm text-muted-foreground">Used on the Tradinta Direct marketing page.</p>
                        <PhotoUpload
                            onUpload={setDirectLogoUrl}
                            initialUrl={directLogoUrl || "https://i.postimg.cc/hG0TLTyF/image.png"}
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label>The Foundry Logo</Label>
                            <p className="text-sm text-muted-foreground">Used on the Foundry page for group-buying deals.</p>
                        <PhotoUpload
                            onUpload={setFoundryLogoUrl}
                            initialUrl={foundryLogoUrl || "https://i.postimg.cc/VkfCYdsM/image.png"}
                        />
                    </div>
                </div>
            </CardContent>
                <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Save Brand Assets
                </Button>
            </CardFooter>
        </Card>
    );
};

const MediaLibraryTab = () => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();

    const [isUploading, setIsUploading] = React.useState(false);
    const [title, setTitle] = React.useState('');
    const [searchQuery, setSearchQuery] = React.useState('');
    
    const mediaQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'mediaLibrary'), orderBy('uploadedAt', 'desc')) : null, [firestore]);
    const { data: mediaAssets, isLoading: isLoadingAssets, forceRefetch } = useCollection<MediaAsset>(mediaQuery);

    const handleUploadComplete = async (url: string) => {
        if (!url || !user || !firestore) return;

        try {
            await addDoc(collection(firestore, 'mediaLibrary'), {
                id: nanoid(),
                title: title,
                imageUrl: url,
                uploadedBy: user.uid,
                uploadedAt: serverTimestamp(),
            });
            toast({ title: 'Image Saved!', description: 'Your image has been added to the library.' });
            setTitle(''); // Clear title after upload
            forceRefetch();
        } catch (error: any) {
            toast({ title: 'Error Saving Image', description: error.message, variant: 'destructive' });
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'URL Copied!', description: 'The Cloudinary link has been copied to your clipboard.' });
    };
    
    const filteredAssets = React.useMemo(() => {
        if (!mediaAssets) return [];
        if (!searchQuery.trim()) return mediaAssets;
        return mediaAssets.filter(asset => asset.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [mediaAssets, searchQuery]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Media Library</CardTitle>
                <CardDescription>Upload, manage, and retrieve links for all your marketing and site images.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Upload New Image</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                             <Label htmlFor="image-title">Image Title (Optional)</Label>
                             <Input id="image-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Homepage Hero Banner Summer"/>
                         </div>
                        <PhotoUpload
                            label="Upload Image"
                            onUpload={handleUploadComplete}
                            onLoadingChange={setIsUploading}
                            disabled={isUploading}
                        />
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                         <CardTitle className="text-lg">Uploaded Assets</CardTitle>
                         <div className="relative pt-2">
                            <Search className="absolute left-2.5 top-4.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by title..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAssets ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                         !filteredAssets || filteredAssets.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">No assets found.</p> :
                         (
                            <ScrollArea className="h-96 pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredAssets.map(asset => (
                                        <div key={asset.id} className="border rounded-lg p-3 space-y-2">
                                            <div className="relative aspect-video w-full rounded-md bg-muted overflow-hidden">
                                                <Image src={asset.imageUrl} alt={asset.title || 'Media asset'} fill className="object-contain" />
                                            </div>
                                            <p className="font-semibold text-sm truncate">{asset.title || 'Untitled'}</p>
                                            <div className="flex items-center gap-1">
                                                <Input readOnly value={asset.imageUrl} className="h-8 text-xs bg-background" />
                                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => copyToClipboard(asset.imageUrl)}><Copy className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                         )}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    )
}


export default function ContentManagementDashboard() {
    const firestore = useFirestore();
    const [categories, setCategories] = React.useState<ProductCategory[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);


    const bannersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'homepageBanners'), orderBy('order', 'asc')) : null, [firestore]);
    const postsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'blogPosts'), orderBy('publishedAt', 'desc')) : null, [firestore]);
    const pagesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'sitePages'), orderBy('title', 'asc')) : null, [firestore]);

    const { data: homepageBanners, isLoading: isLoadingBanners } = useCollection<HomepageBanner>(bannersQuery);
    const { data: blogPosts, isLoading: isLoadingPosts } = useCollection<BlogPost>(postsQuery);
    const { data: sitePages, isLoading: isLoadingPages } = useCollection<SitePage>(pagesQuery);

    React.useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            const fetched = await getProductCategories();
            setCategories(fetched);
            setIsLoadingCategories(false);
        };
        fetchCategories();
    }, []);

    const renderSkeletonRows = (count: number, columns: number) => Array.from({ length: count }).map((_, i) => (
        <TableRow key={`skel-row-${i}`}>
            {Array.from({ length: columns }).map((_, j) => (
                <TableCell key={`skel-cell-${j}`}><Skeleton className="h-5 w-full" /></TableCell>
            ))}
        </TableRow>
    ));

    return (
        <Tabs defaultValue="banners">
            <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="banners">Homepage Banners</TabsTrigger>
                <TabsTrigger value="blog">Blog & Insights</TabsTrigger>
                <TabsTrigger value="static-pages">Static Pages</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="branding">Branding & Logos</TabsTrigger>
                <TabsTrigger value="media-library">Media Library</TabsTrigger>
            </TabsList>

            <TabsContent value="banners">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Homepage Banners</CardTitle>
                                <CardDescription>Manage promotional and informational banners on the homepage.</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href="/dashboards/content-management/banners/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Banner
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingBanners ? renderSkeletonRows(2, 4) 
                                : homepageBanners && homepageBanners.length > 0 ? homepageBanners.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell>{banner.order}</TableCell>
                                        <TableCell className="font-medium">{banner.title}</TableCell>
                                        <TableCell><Badge variant={banner.status === 'published' ? 'secondary' : 'outline'}>{banner.status}</Badge></TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboards/content-management/banners/edit/${banner.id}`}>Edit</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                                : <TableRow><TableCell colSpan={4} className="text-center h-24">No banners created yet.</TableCell></TableRow>
                                }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="blog">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Blog Posts & Insights</CardTitle>
                                <CardDescription>Create and manage articles for the Tradinta Insights section.</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href="/dashboards/content-management/blog/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Published Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {isLoadingPosts ? renderSkeletonRows(3, 5)
                                : blogPosts && blogPosts.length > 0 ? blogPosts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell><Badge variant={post.status === 'published' ? 'secondary' : post.status === 'archived' ? 'destructive' : 'outline'}>{post.status}</Badge></TableCell>
                                        <TableCell>{post.author}</TableCell>
                                        <TableCell>{post.publishedAt ? new Date(post.publishedAt?.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboards/content-management/blog/edit/${post.id}`}>Edit</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                                : <TableRow><TableCell colSpan={5} className="text-center h-24">No blog posts created yet.</TableCell></TableRow>
                               }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="static-pages">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Static Pages</CardTitle>
                                <CardDescription>Edit content on pages like "About Us", "Privacy Policy", etc.</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href="/dashboards/content-management/pages/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Page
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Page Title</TableHead>
                                    <TableHead>URL Slug</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {isLoadingPages ? renderSkeletonRows(2, 4)
                                : sitePages && sitePages.length > 0 ? sitePages.map((page) => (
                                    <TableRow key={page.id}>
                                        <TableCell className="font-medium">{page.title}</TableCell>
                                        <TableCell className="font-mono text-xs">/{page.slug}</TableCell>
                                        <TableCell>{page.lastUpdated ? new Date(page.lastUpdated?.seconds * 1000).toLocaleString() : 'N/A'}</TableCell>
                                        <TableCell>
                                             <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboards/content-management/pages/edit/${page.id}`}>Edit</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                                : <TableRow><TableCell colSpan={4} className="text-center h-24">No static pages created yet.</TableCell></TableRow>
                               }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="categories">
                <Card>
                    <CardHeader>
                         <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Category Management</CardTitle>
                                <CardDescription>Manage the images and details for product categories.</CardDescription>
                            </div>
                             <Button asChild>
                                <Link href="/dashboards/content-management/categories/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> New Category
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead>Display Order</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingCategories ? renderSkeletonRows(4, 4) : 
                                 categories && categories.length > 0 ? categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <div className="relative h-16 w-24 rounded-md overflow-hidden">
                                                <Image src={category.imageUrl || 'https://placehold.co/100x75'} alt={category.name} layout="fill" objectFit="cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>{category.displayOrder}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboards/content-management/categories/edit/${category.id}`}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                                : <TableRow><TableCell colSpan={4} className="h-24 text-center">No categories found in Firestore.</TableCell></TableRow>
                               }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="branding">
                <BrandingTab />
            </TabsContent>
            
            <TabsContent value="media-library">
                <MediaLibraryTab />
            </TabsContent>

        </Tabs>
    );
}
