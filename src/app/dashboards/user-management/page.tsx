
'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Shield,
  Building,
  ShoppingCart,
  Search,
  Loader2,
  File,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
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
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';

type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status?: 'active' | 'suspended';
  tradintaId: string;
  restrictedPermissions?: string[];
};

const SummaryCard = ({
  title,
  icon,
  count,
  isLoading,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <div className="text-2xl font-bold">{count.toLocaleString()}</div>
      )}
    </CardContent>
  </Card>
);

export default function UserManagementPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [displayedUsers, setDisplayedUsers] = React.useState<UserProfile[]>([]);

    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users')) : null),
        [firestore]
    );
    const { data: allUsers, isLoading: isLoadingAllUsers } =
        useCollection<UserProfile>(usersQuery);

    const sellersQuery = useMemoFirebase(
        () =>
        firestore
            ? query(collection(firestore, 'users'), where('role', '==', 'manufacturer'))
            : null,
        [firestore]
    );
    const { data: sellers, isLoading: isLoadingSellers } =
        useCollection(sellersQuery);

    const buyersQuery = useMemoFirebase(
        () =>
        firestore
            ? query(collection(firestore, 'users'), where('role', '==', 'buyer'))
            : null,
        [firestore]
    );
    const { data: buyers, isLoading: isLoadingBuyers } =
        useCollection(buyersQuery);

    const adminsQuery = useMemoFirebase(
        () =>
        firestore
            ? query(
                collection(firestore, 'users'),
                where('role', 'in', ['admin', 'super-admin'])
            )
            : null,
        [firestore]
    );
    const { data: admins, isLoading: isLoadingAdmins } =
        useCollection(adminsQuery);

    const summaryCards = [
        {
        title: 'Total Users',
        count: allUsers?.length || 0,
        icon: <Users />,
        isLoading: isLoadingAllUsers,
        },
        {
        title: 'Sellers (Manufacturers)',
        count: sellers?.length || 0,
        icon: <Building />,
        isLoading: isLoadingSellers,
        },
        {
        title: 'Buyers',
        count: buyers?.length || 0,
        icon: <ShoppingCart />,
        isLoading: isLoadingBuyers,
        },
        {
        title: 'Admin Staff',
        count: admins?.length || 0,
        icon: <Shield />,
        isLoading: isLoadingAdmins,
        },
    ];

    const handleSearch = async (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        const searchTerm = searchQuery.trim();
        if (!firestore || !searchTerm) {
        setDisplayedUsers([]);
        return;
        }
        setIsSearching(true);
        setDisplayedUsers([]);

        let userFound: UserProfile | null = null;

        if (searchTerm.includes('@')) {
        const emailDocRef = doc(firestore, 'emails', searchTerm);
        const emailDocSnap = await getDoc(emailDocRef);

        if (emailDocSnap.exists()) {
            const userId = emailDocSnap.data().userId;
            const userDocRef = doc(firestore, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
            userFound = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
            }
        }
        } else { // Assume it's a Tradinta ID
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('tradintaId', '==', searchTerm));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            userFound = { id: doc.id, ...doc.data() } as UserProfile;
        }
        }

        if (userFound) {
        setDisplayedUsers([userFound]);
        } else {
            toast({
                title: "Not Found",
                description: "No user found with that email or ID.",
                variant: "destructive",
            })
        }

        setIsSearching(false);
    };
    
    const handleLoadAll = async () => {
        if (!firestore) return;
        setIsSearching(true);
        setDisplayedUsers([]);

        const allUsersQuery = query(collection(firestore, 'users'));
        const querySnapshot = await getDocs(allUsersQuery);
        const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        
        setDisplayedUsers(usersList);
        setIsSearching(false);
    };

    const handleExportCsv = () => {
        if (displayedUsers.length === 0) {
        toast({
            title: "No data to export",
            description: "Please search for users or load all users before exporting.",
            variant: "destructive",
        });
        return;
        }
        
        const headers = ['Tradinta ID', 'Full Name', 'Email', 'Role', 'Status'];
        const rows = displayedUsers.map(user => 
        [
            user.tradintaId || 'N/A',
            `"${user.fullName || ''}"`,
            user.email,
            user.role,
            user.status || 'Active'
        ].join(',')
        );
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tradinta_users.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
        title: "Export Successful",
        description: `${displayedUsers.length} users exported to CSV.`
        });
    };

    const renderTableRows = () => {
        if (isSearching) {
        return (
            <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            </TableCell>
            </TableRow>
        );
        }

        if (displayedUsers.length === 0) {
        return (
            <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
                No users found. Enter an email or Tradinta ID to search, or load all users.
            </TableCell>
            </TableRow>
        );
        }

        return displayedUsers.map((user) => (
        <TableRow key={user.id}>
            <TableCell className="font-mono text-xs">
            {user.tradintaId || 'N/A'}
            </TableCell>
            <TableCell className="font-medium">{user.fullName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell className="capitalize">{user.role}</TableCell>
            <TableCell>
            <Badge
                variant={
                user.status === 'active' || user.status === undefined
                    ? 'secondary'
                    : 'destructive'
                }
            >
                {user.status || 'active'}
            </Badge>
            </TableCell>
            <TableCell className="space-x-2">
            <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboards/user-management/${user.id}`}>Manage</Link>
            </Button>
            </TableCell>
        </TableRow>
        ));
    };

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>User Management</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <Card>
                <CardHeader>
                <CardTitle>User Management Dashboard</CardTitle>
                <CardDescription>
                    Oversee all users, manage roles, and control access across the
                    platform.
                </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((item) => (
                <SummaryCard key={item.title} {...item} />
                ))}
            </div>

            <Card>
                <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                    <CardTitle>Find & Manage Users</CardTitle>
                    <CardDescription>
                        Search for specific users or load the complete user list.
                    </CardDescription>
                    </div>
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        placeholder="Search by email or ID..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={isSearching}>
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                        Search
                    </Button>
                    </form>
                </div>
                </CardHeader>
                <CardContent>
                <div className="flex justify-end gap-2 mb-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <AlertTriangle className="mr-2 h-4 w-4"/> Load All Users
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Loading all users can be slow and may cause performance issues on your browser if the user base is very large. Proceed with caution.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLoadAll}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" onClick={handleExportCsv}>
                        <File className="mr-2 h-4 w-4" /> Export to CSV
                    </Button>
                </div>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Tradinta ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Primary Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>{renderTableRows()}</TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
    );
}
