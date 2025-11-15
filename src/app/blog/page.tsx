
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { getAllBlogPosts } from '@/app/lib/data';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  author: string;
  content: string;
  publishedAt: any;
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Tradinta Insights</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          News, analysis, and resources for Africa's manufacturing sector.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.length > 0 ? posts?.map((post) => (
              <Card key={post.id} className="flex flex-col">
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    <Image src={`https://picsum.photos/seed/${post.id}/600/400`} alt={post.title} fill className="object-cover" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl h-14 overflow-hidden">{post.title}</CardTitle>
                  <CardDescription>
                    By {post.author} on {post.publishedAt ? new Date(post.publishedAt.seconds * 1000).toLocaleDateString() : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground line-clamp-3">
                    {post.content.substring(0, 150)}...
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="link" className="p-0">
                    <Link href={`/blog/${post.slug}`}>
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          : (
            <div className="md:col-span-3 text-center py-16 text-muted-foreground">
                <p>No articles published yet. Check back soon!</p>
            </div>
          )
        }
      </div>
    </div>
  );
}
