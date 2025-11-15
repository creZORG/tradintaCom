
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { type Review, type Product } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Star, CheckCircle, Trash2, Flag, MessageSquare, Send, Loader2, CornerDownRight } from 'lucide-react';
import { LeaveReviewForm } from '@/components/leave-review-form';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { logFeatureUsage } from '@/lib/analytics';
import { ReportModal } from './report-modal';
import { Textarea } from './ui/textarea';

type Reply = {
    id: string;
    text: string;
    authorName: string;
    createdAt: any;
    isSupportReply: boolean;
};

const ReviewReplies = ({ reviewId }: { reviewId: string }) => {
    const firestore = useFirestore();
    const repliesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'reviews', reviewId, 'replies'), orderBy('createdAt', 'asc'));
    }, [firestore, reviewId]);

    const { data: replies, isLoading } = useCollection<Reply>(repliesQuery);

    if (isLoading) {
        return (
            <div className="pl-11 pt-4">
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    if (!replies || replies.length === 0) {
        return null;
    }

    return (
        <div className="pl-11 pt-4 space-y-4">
            {replies.map(reply => (
                <div key={reply.id} className="flex items-start gap-3">
                    <CornerDownRight className="w-5 h-5 text-muted-foreground mt-2" />
                    <div className="p-3 bg-muted/50 rounded-lg flex-grow">
                         <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm">{reply.authorName}</p>
                            <p className="text-xs text-muted-foreground">{reply.createdAt ? formatDistanceToNow(reply.createdAt.toDate()) : ''} ago</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{reply.text}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}


const ReplyForm = ({ review, onReplySuccess }: { review: Review, onReplySuccess: () => void }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [replyText, setReplyText] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleReplySubmit = async () => {
        if (!replyText.trim() || !user || !firestore) return;
        setIsSubmitting(true);
        try {
            const replyData = {
                text: replyText,
                authorId: user.uid,
                authorName: user.displayName || 'Admin',
                createdAt: serverTimestamp(),
            };
            // In a real app, you might add this to a 'replies' subcollection.
            // For simplicity, we'll update the review document.
            const reviewRef = doc(firestore, 'reviews', review.id);
            await addDocumentNonBlocking(collection(reviewRef, 'replies'), replyData);

            toast({ title: 'Reply Posted!' });
            setReplyText('');
            onReplySuccess();
        } catch (error: any) {
            toast({ title: 'Error', description: `Could not post reply: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="pl-11 pt-2 space-y-2">
            <Textarea 
                placeholder={`Replying to ${review.buyerName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setReplyText('')}>Cancel</Button>
                <Button size="sm" onClick={handleReplySubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Post Reply
                </Button>
            </div>
        </div>
    )
}

interface ProductReviewsProps {
    product: Product;
}

export function ProductReviews({ product }: ProductReviewsProps) {
    const firestore = useFirestore();
    const { user, role } = useUser();
    const { toast } = useToast();
    const [replyingTo, setReplyingTo] = React.useState<string | null>(null);


    const reviewsQuery = useMemoFirebase(() => {
        if (!firestore || !product.id) return null;
        return query(
            collection(firestore, 'reviews'),
            where('productId', '==', product.id),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, product.id]);

    const { data: reviews, isLoading, forceRefetch } = useCollection<Review>(reviewsQuery);
    
    const userHasReviewed = React.useMemo(() => {
        if (!user || !reviews) return false;
        return reviews.some(review => review.buyerId === user.uid);
    }, [user, reviews]);

    const handleDeleteReview = async (review: Review) => {
        if (!firestore || !user || !role) return;
        logFeatureUsage({ feature: 'reviews:delete', userId: user.uid, userRole: role, metadata: { reviewId: review.id, productId: review.productId } });
        const reviewRef = doc(firestore, 'reviews', review.id);
        try {
            await deleteDocumentNonBlocking(reviewRef);
            toast({
                title: 'Review Deleted',
                description: 'The review has been permanently removed.',
            });
            forceRefetch(); // Refresh the list
        } catch (error: any) {
            toast({
                title: 'Error',
                description: `Failed to delete review: ${error.message}`,
                variant: 'destructive',
            });
        }
    };
    
    const isAdmin = role === 'admin' || role === 'super-admin';
    const isSeller = user?.uid === product.manufacturerId;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
                {userHasReviewed ? (
                    <div className="text-center p-4 border rounded-lg bg-muted/50">
                        <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                        <p className="font-semibold">Thank you for your review!</p>
                        <p className="text-sm text-muted-foreground">Your feedback is now live.</p>
                    </div>
                ) : (
                    <LeaveReviewForm product={product} onReviewSubmit={forceRefetch} />
                )}
            </div>
            <Separator />
            <div>
                <h3 className="text-lg font-semibold mb-4">Customer Reviews ({reviews?.length || 0})</h3>
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : reviews && reviews.length > 0 ? (
                        reviews.map(review => (
                            <div key={review.id} className="p-4 border rounded-lg group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={review.buyerAvatar} />
                                            <AvatarFallback>{review.buyerName?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{review.buyerName}</p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <p>on {review.productName}</p>
                                                <span className="mx-1">•</span>
                                                <p>{review.createdAt ? formatDistanceToNow(review.createdAt.toDate()) : ''} ago</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}/>
                                            ))}
                                        </div>
                                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ReportModal reportType="Review" referenceId={review.id} productName={product.name}>
                                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                                     <Flag className="w-4 h-4"/>
                                                 </Button>
                                            </ReportModal>
                                            {isAdmin && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                                            <Trash2 className="w-4 h-4"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete this review.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteReview(review)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground pl-11 pt-1">"{review.comment}"</p>
                                <div className="pl-11 pt-2">
                                     {(isAdmin || isSeller) && (
                                        replyingTo !== review.id ? (
                                            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(review.id)}>
                                                <MessageSquare className="mr-2 h-4 w-4" /> Reply
                                            </Button>
                                        ) : null
                                     )}
                                </div>
                                <ReviewReplies reviewId={review.id} />
                                {replyingTo === review.id && <ReplyForm review={review} onReplySuccess={() => { setReplyingTo(null); forceRefetch(); }} />}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No reviews for this product yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
