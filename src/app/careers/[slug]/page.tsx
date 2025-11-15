
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { getJobOpeningBySlug } from '@/app/lib/data'; // We'll create this function
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string }
}
 
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const job = await getJobOpeningBySlug(params.slug);
 
  if (!job) {
    return {
      title: 'Job Not Found',
      description: 'This job opening is no longer available.',
    }
  }
 
  return {
    title: `${job.title} at Tradinta`,
    description: `Apply for the ${job.title} position in the ${job.department} department at Tradinta. Location: ${job.location}.`,
  }
}


export default async function JobOpeningPage({
  params,
}: {
  params: { slug: string };
}) {
  const job = await getJobOpeningBySlug(params.slug);

  if (!job) {
    return notFound();
  }

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/careers">Careers</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{job.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <Badge variant="outline" className="mb-2">{job.department}</Badge>
                <CardTitle className="text-3xl font-headline">{job.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground mt-2">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location}</div>
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {job.type}</div>
                </div>
            </div>
             <Button size="lg" className="w-full sm:w-auto">Apply Now</Button>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
            <p className="lead">{job.description}</p>
            
            {job.responsibilities && job.responsibilities.length > 0 && (
                <>
                    <h3>Responsibilities</h3>
                    <ul>
                        {job.responsibilities.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </>
            )}

            {job.qualifications && job.qualifications.length > 0 && (
                 <>
                    <h3>Qualifications</h3>
                    <ul>
                        {job.qualifications.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </>
            )}
        </CardContent>
         <CardFooter>
            <Button size="lg" className="w-full sm:w-auto mx-auto">Apply for this position</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
