'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Copy, Mail } from "lucide-react";
import { generateNewsletterContent, type NewsletterContentOutput } from '@/ai/flows/newsletter-content-flow';
import { Separator } from '../ui/separator';

export default function NewsletterAssistantTab() {
    const [topic, setTopic] = React.useState('This week\'s top factory-direct deals');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [generatedContent, setGeneratedContent] = React.useState<NewsletterContentOutput | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!topic) {
            toast({ title: 'Please enter a topic.', variant: 'destructive' });
            return;
        }
        setIsGenerating(true);
        setGeneratedContent(null);
        try {
            const result = await generateNewsletterContent(topic);
            setGeneratedContent(result);
            toast({ title: 'Newsletter content generated!' });
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to generate content: ' + error.message, variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({title: 'Copied to clipboard!'});
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Newsletter Assistant</CardTitle>
                <CardDescription>
                    Automatically generate engaging newsletter content featuring your top sponsored products.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="topic">Newsletter Topic</Label>
                    <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'Generating...' : 'Generate Content'}
                </Button>
            </CardContent>
            
            {generatedContent && (
                <CardContent>
                    <Separator className="my-4" />
                    <div className="space-y-6">
                        <div>
                            <Label className="text-xs text-muted-foreground">Email Subject Line</Label>
                             <div className="flex items-center gap-2">
                                <p className="font-semibold flex-grow">{generatedContent.subjectLine}</p>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(generatedContent.subjectLine)}><Copy className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <Separator />
                        <div className="prose prose-sm max-w-none">
                            <p>{generatedContent.introduction}</p>
                            {generatedContent.productFeatures.map((feature, index) => (
                                <div key={index}>
                                    <h4>{feature.productName}</h4>
                                    <p>{feature.generatedCopy}</p>
                                    <p><a href="#">{feature.callToAction}</a></p>
                                </div>
                            ))}
                            <p>{generatedContent.closing}</p>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
