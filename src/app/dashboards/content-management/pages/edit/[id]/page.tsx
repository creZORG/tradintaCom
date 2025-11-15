'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { generateSlug } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type SitePage = {
    title: string;
    slug: string;
    content: string;
};


const createMarkup = (markdown?: string) => {
    if (!markdown) return { __html: '' };

    let html = markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
        .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>")
        .replace(/\n$/gim, '<br />')
        .replace(/\n/g, '<br />');

    html = html.replace(/(\<br \/\>)?\s?\*\s(.*?)(?=\<br \/\>|$)/g, '<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
    
    html = html.replace(/(\<br \/\>)?\s?\d\.\s(.*?)(?=\<br \/\>|$)/g, '<li>$2</li>');
    html = html.replace(/<li>(.*?)<\/li>/g, (match, content) => {
        if (content.match(/^\d\./)) return match;
        return `<li>${content}</li>`;
    });
    html = html.replace(/(<li>.*<\/li>)+/g, (match) => {
        if(match.includes('<ul>')) return match;
        if(match.match(/<li>\d\./)) return match;
        return `<ol>${match}</ol>`;
    });

    html = html.replace(/<p><\/p>/g, '');

    return { __html: html };
};

export default function EditSitePage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.id as string;
    const firestore = useFirestore();
    const { toast } = useToast();

    const pageDocRef = useMemoFirebase(() => firestore && pageId ? doc(firestore, 'sitePages', pageId) : null, [firestore, pageId]);
    const { data: page, isLoading: isPageLoading } = useDoc<SitePage>(pageDocRef);

    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (page) {
            setTitle(page.title || '');
            setContent(page.content || '');
        }
    }, [page]);

    const handleSave = async () => {
        if (!pageDocRef) return;
        setIsSaving(true);
        try {
            await updateDoc(pageDocRef, {
                title,
                slug: page?.slug || generateSlug(title), // Keep original slug or generate if it was missing
                content,
                lastUpdated: serverTimestamp(),
            });
            toast({ title: 'Success', description: 'Page updated successfully.' });
            router.push('/dashboards/content-management');
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to update page.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isPageLoading) return <Skeleton className="w-full h-96" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/content-management"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">Edit: {page?.title}</h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader><CardTitle>Page Content</CardTitle><CardDescription>Use Markdown for formatting.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-3">
                        <Label htmlFor="title">Page Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="content">Content</Label>
                        <Tabs defaultValue="edit">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="edit">Edit</TabsTrigger>
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                            </TabsList>
                            <TabsContent value="edit">
                                <Textarea id="content" className="min-h-96" value={content} onChange={(e) => setContent(e.target.value)} />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Use Markdown for formatting: <code className="bg-muted px-1 rounded"># H1</code>, <code className="bg-muted px-1 rounded">## H2</code>, <code className="bg-muted px-1 rounded">**bold**</code>, <code className="bg-muted px-1 rounded">*italic*</code>, <code className="bg-muted px-1 rounded">- List item</code>.
                                </p>
                            </TabsContent>
                            <TabsContent value="preview">
                                <div className="prose min-h-96 w-full rounded-md border border-input p-4" dangerouslySetInnerHTML={createMarkup(content)} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
