
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { generateSlug } from '@/lib/utils';

type JobOpening = {
    title: string;
    department: string;
    location: string;
    type: string;
    experienceLevel: string;
    salary: string;
    description: string;
    responsibilities: string[];
    qualifications: string[];
    status: 'Draft' | 'Open' | 'Closed';
};

export default function EditJobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;
    const firestore = useFirestore();
    const { toast } = useToast();

    const jobDocRef = useMemoFirebase(() => jobId && firestore ? doc(firestore, 'jobOpenings', jobId) : null, [firestore, jobId]);
    const { data: job, isLoading } = useDoc<JobOpening>(jobDocRef);
    
    const [formState, setFormState] = React.useState<Partial<JobOpening>>({});
    const [isSaving, setIsSaving] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        if (job) {
            setFormState({
                ...job,
                responsibilities: job.responsibilities || [],
                qualifications: job.qualifications || [],
            });
        }
    }, [job]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof JobOpening, value: string) => {
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleArrayChange = (name: 'responsibilities' | 'qualifications', value: string) => {
        setFormState(prev => ({ ...prev, [name]: value.split('\n').filter(line => line.trim() !== '') }));
    };

    const handleSave = async () => {
        if (!jobDocRef || !formState.title) return;
        setIsSaving(true);
        try {
            await updateDocumentNonBlocking(jobDocRef, {
                ...formState,
                slug: generateSlug(formState.title),
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: 'Job posting updated.' });
            router.push('/dashboards/admin?tab=job-postings');
        } catch (e: any) {
            toast({ title: 'Error', description: 'Failed to update job posting: ' + e.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!jobDocRef) return;
        setIsDeleting(true);
        try {
            await deleteDocumentNonBlocking(jobDocRef);
            toast({ title: 'Success', description: 'Job posting deleted.', variant: 'destructive' });
            router.push('/dashboards/admin?tab=job-postings');
        } catch (e: any) {
            toast({ title: 'Error', description: 'Failed to delete job posting.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };
    
    if (isLoading) {
        return <div className="space-y-6"><Skeleton className="h-96" /></div>;
    }

    if (!job) {
        return <div>Job posting not found.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/admin?tab=job-postings"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">Edit Job Posting</h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this job posting.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader><CardTitle>Job Details</CardTitle><CardDescription>Update the details for this vacancy.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-3"><Label htmlFor="title">Job Title</Label><Input id="title" name="title" value={formState.title || ''} onChange={handleInputChange} required /></div>
                        <div className="grid gap-3"><Label htmlFor="department">Department</Label><Input id="department" name="department" value={formState.department || ''} onChange={handleInputChange} required /></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="grid gap-3"><Label htmlFor="location">Location</Label><Input id="location" name="location" value={formState.location || ''} onChange={handleInputChange} required /></div>
                        <div className="grid gap-3">
                            <Label htmlFor="type">Job Type</Label>
                            <Select name="type" value={formState.type} onValueChange={(v) => handleSelectChange('type', v)}>
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
                            <Select name="experienceLevel" value={formState.experienceLevel} onValueChange={(v) => handleSelectChange('experienceLevel', v)}>
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
                         <div className="grid gap-3"><Label htmlFor="salary">Salary</Label><Input id="salary" name="salary" value={formState.salary || ''} onChange={handleInputChange} /></div>
                         <div className="grid gap-3">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" value={formState.status} onValueChange={(v) => handleSelectChange('status', v)}>
                                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                     </div>
                    <div className="grid gap-3"><Label htmlFor="description">Job Description</Label><Textarea id="description" name="description" className="min-h-24" value={formState.description || ''} onChange={handleInputChange} /></div>
                    <div className="grid gap-3"><Label htmlFor="responsibilities">Responsibilities</Label><Textarea id="responsibilities" name="responsibilities" className="min-h-32" value={formState.responsibilities?.join('\n') || ''} onChange={e => handleArrayChange('responsibilities', e.target.value)} /></div>
                    <div className="grid gap-3"><Label htmlFor="qualifications">Qualifications</Label><Textarea id="qualifications" name="qualifications" className="min-h-32" value={formState.qualifications?.join('\n') || ''} onChange={e => handleArrayChange('qualifications', e.target.value)} /></div>
                </CardContent>
            </Card>
        </div>
    );
}
