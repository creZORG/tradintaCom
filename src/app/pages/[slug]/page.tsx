
'use client';

import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { notFound, useParams } from 'next/navigation';
import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';

// You might want to use a library like 'react-markdown' to render markdown content safely
// For this example, we'll use a simple div with dangerouslySetInnerHTML, but be cautious with this in production.
// import ReactMarkdown from 'react-markdown'; 

type SitePage = {
    title: string;
    content: string;
    lastUpdated: any;
};

// NOTE: Dynamic metadata for client components is not straightforward.
// For full SEO, it's better to convert this to a Server Component.
// This is a placeholder and will not affect the server-rendered head.
/*
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const db = await getDb(); // Assumes a server-side way to get DB
  const pageQuery = query(collection(db, 'sitePages'), where('slug', '==', params.slug), limit(1));
  const querySnapshot = await getDocs(pageQuery);
  
  if (querySnapshot.empty) {
    return { title: 'Page Not Found' };
  }
  
  const page = querySnapshot.docs[0].data() as SitePage;

  return {
    title: `${page.title} | Tradinta`,
    description: page.content.substring(0, 160) + '...',
  };
}
*/


export default function StaticPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();
    
    const [page, setPage] = React.useState<SitePage | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchPage = async () => {
            if (!firestore || !slug) return;
            setIsLoading(true);

            const pageQuery = query(collection(firestore, 'sitePages'), where('slug', '==', slug), limit(1));
            const querySnapshot = await getDocs(pageQuery);

            if (querySnapshot.empty) {
                setPage(null);
            } else {
                const pageData = querySnapshot.docs[0].data() as SitePage;
                setPage(pageData);
                // Dynamically update document title on client-side
                document.title = `${pageData.title} | Tradinta`;
            }
            setIsLoading(false);
        }

        fetchPage();
    }, [firestore, slug]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-12">
                <Skeleton className="h-8 w-64 mb-8" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!page) {
        return notFound();
    }
    
    // In a real app, you would use a markdown renderer here for safety and functionality
    // e.g. <ReactMarkdown>{page.content}</ReactMarkdown>
    // For now, using dangerouslySetInnerHTML. Be aware of XSS risks if content is not controlled.
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

        // Handle unordered lists
        html = html.replace(/(\<br \/\>)?\s?\*\s(.*?)(?=\<br \/\>|$)/g, '<li>$2</li>');
        html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
        
        // Handle ordered lists
        html = html.replace(/(\<br \/\>)?\s?\d\.\s(.*?)(?=\<br \/\>|$)/g, '<li>$2</li>');
        html = html.replace(/<li>(.*?)<\/li>/g, (match, content) => {
            if (content.match(/^\d\./)) return match;
            return `<li>${content}</li>`;
        });
        html = html.replace(/(<li>.*<\/li>)+/g, (match) => {
            if(match.includes('<ul>')) return match;
            if(match.match(/<li>\d\./)) return match; // Bit of a hack to avoid re-wrapping
            return `<ol>${match}</ol>`;
        });

        // Cleanup empty paragraphs
        html = html.replace(/<p><\/p>/g, '');

        return { __html: html };
    };

    return (
        <div className="container mx-auto py-12">
             <Breadcrumb className="mb-6">
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{page.title}</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">{page.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose" dangerouslySetInnerHTML={createMarkup(page.content)} />
                </CardContent>
            </Card>
        </div>
    );
}
