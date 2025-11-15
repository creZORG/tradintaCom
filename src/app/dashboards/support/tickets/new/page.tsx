
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Send,
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createSupportTicket } from '@/app/dashboards/support/actions';
import { useRouter } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


export default function NewSupportTicketPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        
        const result = await createSupportTicket(formData);

        if (result.success) {
            toast({
                title: 'Ticket Created!',
                description: `Ticket #${result.ticketId} has been created successfully.`,
            });
            router.push('/dashboards/support');
        } else {
            toast({
                title: 'Error',
                description: result.message || 'Failed to create the ticket.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
        }
    };

  return (
    <div className="space-y-6">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboards/support">Support</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>New Ticket</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
       <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/dashboards/support">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Link>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Create New Support Ticket
            </h1>
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                Create Ticket
            </Button>
            </div>
        </div>
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
                <CardDescription>Create a ticket on behalf of a user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-3">
                        <Label htmlFor="userEmail">User Email</Label>
                        <Input id="userEmail" name="userEmail" type="email" placeholder="user@example.com" required />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" name="subject" placeholder="e.g., Issue with Order #123" required />
                    </div>
                </div>
                 <div className="grid md:grid-cols-2 gap-6">
                     <div className="grid gap-3">
                        <Label htmlFor="priority">Priority</Label>
                        <Select name="priority" defaultValue="Medium">
                            <SelectTrigger id="priority"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="status">Initial Status</Label>
                        <Select name="status" defaultValue="Open">
                            <SelectTrigger id="status"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
                 <div className="grid gap-3">
                    <Label htmlFor="message">Initial Message</Label>
                    <Textarea id="message" name="message" required placeholder="Describe the user's issue in detail..." className="min-h-32"/>
                 </div>
            </CardContent>
        </Card>
        <div className="flex justify-end mt-6 md:hidden">
             <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                Create Ticket
            </Button>
        </div>
       </form>
    </div>
  );
}
