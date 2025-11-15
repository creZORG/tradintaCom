
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils';
import { nanoid } from 'nanoid';

export default function NewJobPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore) return;
        setIsSaving(true);
        
        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const responsibilities = (formData.get('responsibilities') as string).split('\n').filter(line => line.trim() !== '');
        const qualifications = (formData.get('qualifications') as string).split('\n').filter(line => line.trim() !== '');

        try {
            const docRef = await addDocumentNonBlocking(collection(firestore, 'jobOpenings'), {
                id: nanoid(),
                title: title,
                slug: generateSlug(title),
                department: formData.get('department'),
                location: formData.get('location'),
                type: formData.get('type'),
                experienceLevel: formData.get('experienceLevel'),
                salary: formData.get('salary'),
                description: formData.get('description'),
                responsibilities,
                qualifications,
                status: formData.get('status'),
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: 'New job posting created.' });
            router.push('/dashboards/admin?tab=job-postings');
        } catch (e: any) {
            toast({ title: 'Error', description: 'Failed to create job posting: ' + e.message, variant: 'destructive' });
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave}>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/dashboards/admin?tab=job-postings"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
                    </Button>
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">New Job Posting</h1>
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Button variant="outline" size="sm" type="button" onClick={() => router.push('/dashboards/admin?tab=job-postings')}>Cancel</Button>
                        <Button size="sm" type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Posting
                        </Button>
                    </div>
                </div>
                <Card>
                    <CardHeader><CardTitle>Job Details</CardTitle><CardDescription>Fill in the details for the new vacancy.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="title">Job Title</Label>
                                <Input id="title" name="title" required />
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="department">Department</Label>
                                <Input id="department" name="department" required />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" defaultValue="Nairobi, Kenya" required />
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="type">Job Type</Label>
                                <Select name="type" defaultValue="Full-time">
                                    <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="experienceLevel">Experience Level</Label>
                                <Select name="experienceLevel" defaultValue="Mid-level">
                                    <SelectTrigger id="experienceLevel"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Entry-level">Entry-level</SelectItem>
                                        <SelectItem value="Mid-level">Mid-level</SelectItem>
                                        <SelectItem value="Senior">Senior</SelectItem>
                                        <SelectItem value="Lead">Lead</SelectItem>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="grid md:grid-cols-2 gap-6">
                             <div className="grid gap-3">
                                <Label htmlFor="salary">Salary</Label>
                                <Input id="salary" name="salary" placeholder="e.g., KES 50,000 - 70,000 or Competitive" />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue="Open">
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                         </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Job Description</Label>
                            <Textarea id="description" name="description" className="min-h-24" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="responsibilities">Responsibilities</Label>
                            <Textarea id="responsibilities" name="responsibilities" className="min-h-32" placeholder="Enter one responsibility per line." />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="qualifications">Qualifications</Label>
                            <Textarea id="qualifications" name="qualifications" className="min-h-32" placeholder="Enter one qualification per line." />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}
