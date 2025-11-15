
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth, setDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, changeUserPassword, requestAccountDeletion, revokeAllSessions, unfollowEntity } from '@/app/dashboards/buyer/actions';
import { ChevronLeft, KeyRound, Loader2, Save, User, LogOut, Trash2, Rss, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type UserProfile = {
    fullName: string;
    email: string;
};

type Following = {
  id: string; // This is the targetId
  name: string;
  type: 'manufacturer' | 'partner';
  imageUrl?: string;
};

const ProfileForm = ({ user, profile }: { user: any, profile: UserProfile }) => {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateUserProfile, { success: false, message: '' });

    React.useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({ title: "Success!", description: state.message });
            } else {
                toast({ title: "Error", description: state.message, variant: 'destructive' });
            }
        }
    }, [state, toast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="userId" value={user.uid} />
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" defaultValue={profile.fullName} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={profile.email} disabled />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </CardFooter>
        </form>
    );
};

const PasswordForm = ({ user }: { user: any }) => {
    const { toast } = useToast();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(changeUserPassword, { success: false, message: '', errors: null });

    React.useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({ title: "Success!", description: state.message });
                formRef.current?.reset();
            } else {
                const errorMessage = state.errors?.newPassword?.[0] || state.errors?.confirmPassword?.[0] || state.message;
                toast({ title: "Error", description: errorMessage, variant: 'destructive' });
            }
        }
    }, [state, toast]);

    return (
        <form ref={formRef} action={formAction}>
            <input type="hidden" name="userId" value={user.uid} />
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" name="newPassword" type="password" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit">
                    <KeyRound className="mr-2 h-4 w-4" /> Change Password
                </Button>
            </CardFooter>
        </form>
    );
};

const FollowingManagement = ({ user }: { user: any }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [followedItems, setFollowedItems] = React.useState<Following[]>([]);
    const [unfollowingId, setUnfollowingId] = React.useState<string | null>(null);
    
    const fetchFollowedItems = React.useCallback(async () => {
        if (!user || !firestore) return;
        setIsLoading(true);
        const followingRef = collection(firestore, 'users', user.uid, 'following');
        const followingSnap = await getDocs(followingRef);
        const items: Following[] = [];

        for (const docSnap of followingSnap.docs) {
            const data = docSnap.data();
            const targetId = docSnap.id;
            const targetCollection = data.type === 'partner' ? 'users' : 'manufacturers';
            
            const targetDocRef = doc(firestore, targetCollection, targetId);
            const targetDocSnap = await getDoc(targetDocRef);

            if(targetDocSnap.exists()) {
                const targetData = targetDocSnap.data();
                items.push({
                    id: targetId,
                    name: targetData.fullName || targetData.shopName || 'Unnamed Entity',
                    type: data.type,
                    imageUrl: targetData.photoURL || targetData.logoUrl,
                });
            }
        }
        setFollowedItems(items);
        setIsLoading(false);
    }, [user, firestore]);

    React.useEffect(() => {
        fetchFollowedItems();
    }, [fetchFollowedItems]);

    const handleUnfollow = async (targetId: string, targetType: 'manufacturer' | 'partner') => {
        if (!user || !firestore) return;
        setUnfollowingId(targetId);

        const result = await unfollowEntity(user.uid, targetId, targetType);
        
        if (result.success) {
            toast({ title: 'Unfollowed successfully' });
            fetchFollowedItems(); // Refetch the list
        } else {
             toast({ title: 'Error', description: 'Could not unfollow.', variant: 'destructive'});
        }
        setUnfollowingId(null);
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Rss /> Following Management</CardTitle>
                <CardDescription>Manage the manufacturers and partners you follow.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : followedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">You are not following anyone yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {followedItems.map(item => (
                            <li key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={item.imageUrl} />
                                        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{item.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnfollow(item.id, item.type)}
                                    disabled={unfollowingId === item.id}
                                >
                                    {unfollowingId === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Unfollow'}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
};

const SecurityPrivacy = ({ user }: { user: any }) => {
    const { toast } = useToast();
    const [isRevoking, setIsRevoking] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const router = useRouter();
    const auth = useAuth();
    
    const lastSignInTime = user.metadata.lastSignInTime 
        ? formatDistanceToNow(new Date(user.metadata.lastSignInTime), { addSuffix: true })
        : 'N/A';
    
    const handleRevoke = async () => {
        setIsRevoking(true);
        const result = await revokeAllSessions(user.uid);
         if (result.success) {
            toast({
                title: 'Sessions Revoked',
                description: 'All other sessions have been logged out. You may need to log in again on other devices.',
            });
        } else {
            toast({
                title: 'Error',
                description: result.message || 'Failed to revoke sessions.',
                variant: 'destructive'
            });
        }
        setIsRevoking(false);
    };
    
    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await requestAccountDeletion(user.uid);
        if (result.success) {
            toast({
                title: 'Account Deletion Initiated',
                description: 'Your account has been deactivated. You will now be logged out.',
            });
            setTimeout(() => {
                if (auth) signOut(auth);
                router.push('/');
            }, 2000);
        } else {
            toast({
                title: 'Error',
                description: result.message || 'Failed to delete account.',
                variant: 'destructive'
            });
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Security & Privacy</CardTitle>
                <CardDescription>Manage active sessions and account status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Card className="p-4">
                    <p className="text-sm font-semibold mb-2">Active Sessions</p>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">Current session</p>
                                <p className="text-muted-foreground">Last sign-in: {lastSignInTime}</p>
                            </div>
                            <Badge variant="secondary">Active Now</Badge>
                        </li>
                    </ul>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="outline" size="sm" className="w-full mt-4" disabled={isRevoking}>
                                 {isRevoking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                Log out of all other devices
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will sign you out of Tradinta on all other computers and devices. You will remain logged in here.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRevoke}>Confirm</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </Card>
            </CardContent>
            <CardFooter className="flex-col items-start pt-4 border-t border-destructive/20">
                <p className="text-sm font-semibold text-destructive mb-2">Danger Zone</p>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4"/> Deactivate My Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently deactivate your account and disable your login. While your order history will be kept for record-keeping, you will lose access to it.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                               {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Yes, deactivate my account
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
};


export default function AccountSettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: profile, isLoading: isProfileLoading, forceRefetch } = useDoc<UserProfile>(userDocRef);

    const isLoading = isUserLoading || isProfileLoading;
    const [isSelfHealing, setIsSelfHealing] = React.useState(false);


    React.useEffect(() => {
      // Self-healing logic for missing user profile
      const selfHeal = async () => {
        if (!isLoading && user && !profile && userDocRef) {
          setIsSelfHealing(true);
          toast({
            title: 'Initializing Profile...',
            description: 'Your user profile was not found. We are creating it for you now.',
          });
          
          try {
            await setDocumentNonBlocking(userDocRef, {
              fullName: user.displayName || 'Tradinta User',
              email: user.email,
              tradintaId: nanoid(8),
            }, { merge: true });
            
            toast({
              title: 'Profile Initialized!',
              description: 'Please refresh the page to see your settings.',
              action: <Button onClick={() => window.location.reload()}>Refresh</Button>
            });
            forceRefetch();

          } catch (error) {
            toast({
              title: 'Error',
              description: 'Could not create your user profile. Please contact support.',
              variant: 'destructive',
            });
          } finally {
            setIsSelfHealing(false);
          }
        }
      };
      selfHeal();
    }, [isLoading, user, profile, userDocRef, forceRefetch, toast]);

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboards/buyer">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Account Settings</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/buyer"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Account Settings
                </h1>
            </div>

            {isLoading || isSelfHealing ? (
                 <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6"><Skeleton className="h-80" /></div>
                    <div className="md:col-span-1 space-y-6"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
                </div>
            ) : user && profile ? (
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Tabs defaultValue="profile">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                                <TabsTrigger value="password"><KeyRound className="mr-2 h-4 w-4" />Password</TabsTrigger>
                            </TabsList>
                            <TabsContent value="profile">
                                 <Card className="border-t-0 rounded-t-none">
                                    <ProfileForm user={user} profile={profile} />
                                </Card>
                            </TabsContent>
                             <TabsContent value="password">
                                <Card className="border-t-0 rounded-t-none">
                                    <PasswordForm user={user} />
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="md:col-span-1 space-y-6">
                        <FollowingManagement user={user} />
                        <SecurityPrivacy user={user} />
                    </div>
                </div>
            ) : (
                <p>Could not load user profile.</p>
            )}
        </div>
    );
}
