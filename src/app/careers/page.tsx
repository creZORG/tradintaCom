
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, MapPin, Briefcase } from 'lucide-react';
import { getAllJobOpenings } from '@/app/lib/data';
import { Badge } from '@/components/ui/badge';

type JobOpening = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
};

export default async function CareersPage() {
  const allJobs = await getAllJobOpenings();

  const jobsByDepartment = allJobs.reduce((acc, job) => {
    const { department } = job;
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(job);
    return acc;
  }, {} as Record<string, JobOpening[]>);

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
          Join Our Team
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          We're building the future of B2B trade in Africa. Explore our open
          positions and find where you fit in.
        </p>
      </div>

      <div className="space-y-12">
        {Object.keys(jobsByDepartment).length > 0 ? (
          Object.entries(jobsByDepartment).map(([department, jobs]) => (
            <section key={department}>
              <h2 className="text-2xl font-bold font-headline mb-6 border-b pb-2">
                {department}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <Card key={job.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-xl h-14 overflow-hidden">
                        {job.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-1">
                         <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/>{job.location}</div>
                         <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/>{job.type}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow"></CardContent>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href={`/careers/${job.slug}`}>
                          View Opening <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg">
            <h3 className="text-xl font-semibold">No Open Positions</h3>
            <p className="mt-2">
              We are not actively hiring at the moment, but we're always looking for talented individuals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
