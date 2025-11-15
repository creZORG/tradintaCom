
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getBlogPostBySlug } from '@/app/lib/data';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    }
  }
 
  return {
    title: `${post.title} | Tradinta Insights`,
    description: post.content.substring(0, 160) + '...',
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160) + '...',
      images: [
        {
          url: `https://picsum.photos/seed/${post.id}/1200/630`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  }
}

// A simple markdown to HTML converter for basic formatting
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

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = await getBlogPostBySlug(params.slug);

    if (!post) {
        return notFound();
    }

    return (
        <div className="container max-w-3xl mx-auto py-12">
             <Breadcrumb className="mb-6">
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                 <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link href="/blog">Insights</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{post.title}</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <article>
                <header className="mb-8">
                    <h1 className="text-4xl font-bold font-headline mb-3">{post.title}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://picsum.photos/seed/${post.author}/32/32`} />
                                <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{post.author}</span>
                        </div>
                        <time dateTime={post.publishedAt?.toDate().toISOString()}>
                           {post.publishedAt ? new Date(post.publishedAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </time>
                    </div>
                </header>
                <div className="prose" dangerouslySetInnerHTML={createMarkup(post.content)} />
            </article>
        </div>
    );
}
