
'use client';
import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, ShieldAlert, Users, Loader2, Package, ShoppingCart, Users2, User, Signal, Building, Handshake, Landmark, Scale, Megaphone, LifeBuoy, Wallet, FileText, ArrowRight, Coins, BarChart, Truck, Shield, BookUser, Settings, FileWarning, ShieldCheck, Percent, Banknote } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, setDocumentNonBlocking } from "@/firebase";
import { collection, query, where, orderBy, limit, collectionGroup, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AddUserToRoleModal } from '@/components/add-user-to-role-modal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PermissionDenied } from '@/components/ui/permission-denied';
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
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


type UserProfile = {
    id: string;
    fullName: string;
    role: string;
    email: string;
};

type ActivityLog = {
    id: string;
    timestamp: any;
    userEmail: string;
    action: string;
    details: string;
};

type SystemAlert = {
    id: string;
    timestamp: any;
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    status: 'new' | 'acknowledged' | 'resolved';
}

type PlatformSettings = {
    allowUnverifiedUploads?: boolean;
    enableTradintaDirect?: boolean;
    enablePointsSystem?: boolean;
    platformFee?: {
        type: 'percentage' | 'fixed';
        value: number;
    }
}

const RoleCard = ({ title, count, isLoading, onAddUser }: { title: string, count?: number, isLoading: boolean, onAddUser: () => void }) => (
    <Card className="hover:bg-muted/50 transition-colors flex items-center p-3 justify-between">
        <div className="flex flex-col">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {isLoading ? <Skeleton className="h-5 w-8 mt-1" /> : <p className="text-xs text-muted-foreground">{count ?? 0} Members</p>}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddUser}>
            <UserPlus className="h-4 w-4" />
            <span className="sr-only">Add user to ${'title'}</span>
        </Button>
    </Card>
);

function SuperAdminDashboardContent() {
    const { isUserLoading, role } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [selectedRole, setSelectedRole] = React.useState({ name: '', value: '' });

    const handleAddUserClick = (role: {name: string, value: string}) => {
        setSelectedRole(role);
        setIsModalOpen(true);
    };

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`);
    };

    // --- Data Fetching ---
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const sellersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'manufacturers')) : null, [firestore]);
    const buyersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'buyer')) : null, [firestore]);
    const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'partner')) : null, [firestore]);
    const productsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'products')) : null, [firestore]);
    const ordersQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'orders')) : null, [firestore]);
    const activityLogsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore]);
    const criticalAlertsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'systemAlerts'), where('status', '==', 'new'), where('severity', '==', 'critical')) : null, [firestore]);
    const platformSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'config') : null, [firestore]);
    
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);
    const { data: sellers, isLoading: isLoadingSellers } = useCollection(sellersQuery);
    const { data: buyers, isLoading: isLoadingBuyers } = useCollection(buyersQuery);
    const { data: partners, isLoading: isLoadingPartners } = useCollection(partnersQuery);
    const { data: products, isLoading: isLoadingProducts } = useCollection(productsQuery);
    const { data: orders, isLoading: isLoadingOrders } = useCollection(ordersQuery);
    const { data: activityLogs, isLoading: isLoadingLogs } = useCollection<ActivityLog>(activityLogsQuery);
    const { data: criticalAlerts, isLoading: isLoadingAlerts } = useCollection<SystemAlert>(criticalAlertsQuery);
    const { data: platformSettings, isLoading: isLoadingSettings, forceRefetch } = useDoc<PlatformSettings>(platformSettingsRef);
    
    // --- State for Settings ---
    const [feeType, setFeeType] = React.useState<'percentage' | 'fixed'>('percentage');
    const [feeValue, setFeeValue] = React.useState<number>(0);
    const [isSavingFee, setIsSavingFee] = React.useState(false);


    React.useEffect(() => {
        if(platformSettings?.platformFee) {
            setFeeType(platformSettings.platformFee.type);
            setFeeValue(platformSettings.platformFee.value);
        } else {
            // Default to 1.5% if not set
            setFeeType('percentage');
            setFeeValue(1.5);
        }
    }, [platformSettings]);

    const handleSettingChange = (key: keyof PlatformSettings, value: boolean) => {
        if (!platformSettingsRef) return;
        setDocumentNonBlocking(platformSettingsRef, { [key]: value }, { merge: true });
        toast({
            title: "Setting Updated",
            description: "The platform setting has been changed.",
        });
        forceRefetch();
    };

    const handleFeeSave = async () => {
        if(!platformSettingsRef) return;
        setIsSavingFee(true);
        try {
            await setDocumentNonBlocking(platformSettingsRef, {
                platformFee: {
                    type: feeType,
                    value: Number(feeValue)
                }
            }, { merge: true });
            toast({ title: "Fee structure updated successfully." });
            forceRefetch();
        } catch (error: any) {
             toast({ title: "Error", description: "Failed to update fee structure.", variant: "destructive" });
        } finally {
            setIsSavingFee(false);
        }
    }


    const renderLogRows = () => {
        if (isLoadingLogs) {
             return Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skel-log-${i}`}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                </TableRow>
            ));
        }
         if (!activityLogs || activityLogs.length === 0) {
            return <TableRow><TableCell colSpan={4} className="h-24 text-center">No activity logs found.</TableCell></TableRow>;
        }
         return activityLogs.map((log) => (
            <TableRow key={log.id}>
                <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                <TableCell>{log.details}</TableCell>
                <TableCell>{log.userEmail}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</TableCell>
            </TableRow>
        ));
    }

    const customerRoles = [
        { name: 'Sellers / Manufacturers', value: 'manufacturer', count: sellers?.length, isLoading: isLoadingSellers },
        { name: 'Registered Buyers', value: 'buyer', count: buyers?.length, isLoading: isLoadingBuyers },
        { name: 'Growth Partners', value: 'partner', count: partners?.length, isLoading: isLoadingPartners },
        { name: 'Distributors', value: 'distributor', count: 0, isLoading: false },
    ];

    const adminRoles = [
        { name: 'Super Admin', value: 'super-admin', count: 1, isLoading: false },
        { name: 'Admin', value: 'admin', count: users?.filter(u => u.role === 'admin').length, isLoading: isLoadingUsers },
        { name: 'Operations', value: 'operations-manager', count: users?.filter(u => u.role === 'operations-manager').length, isLoading: isLoadingUsers },
        { name: 'Marketing', value: 'marketing-manager', count: users?.filter(u => u.role === 'marketing-manager').length, isLoading: isLoadingUsers },
        { name: 'Finance', value: 'finance', count: users?.filter(u => u.role === 'finance').length, isLoading: isLoadingUsers },
        { name: 'Support', value: 'support', count: users?.filter(u => u.role === 'support').length, isLoading: isLoadingUsers },
        { name: 'Legal & Compliance', value: 'legal-compliance', count: users?.filter(u => u.role === 'legal-compliance').length, isLoading: isLoadingUsers },
        { name: 'Content Management', value: 'content-management', count: users?.filter(u => u.role === 'content-management').length, isLoading: isLoadingUsers },
        { name: 'User Management', value: 'user-management', count: users?.filter(u => u.role === 'user-management').length, isLoading: isLoadingUsers },
        { name: 'Analytics', value: 'analytics', count: users?.filter(u => u.role === 'analytics').length, isLoading: isLoadingUsers },
        { name: 'Logistics', value: 'logistics', count: users?.filter(u => u.role === 'logistics').length, isLoading: isLoadingUsers },
    ];

    const tradpayRoles = [
        { name: 'TradPay Admins', value: 'tradpay-admin', count: users?.filter(u => u.role === 'tradpay-admin').length, isLoading: isLoadingUsers },
        { name: 'TradCoin Airdrop Admins', value: 'tradcoin-airdrop', count: users?.filter(u => u.role === 'tradcoin-airdrop').length, isLoading: isLoadingUsers },
    ]

    if (isUserLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Verifying permissions...</p>
        </div>
      );
    }
  
    const hasAccess = role === 'super-admin';
    if (!hasAccess) {
      return <PermissionDenied />;
    }

    return (
        <>
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Super Admin</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <AddUserToRoleModal 
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                roleName={selectedRole.name}
                roleValue={selectedRole.value}
            />
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Platform Overview</TabsTrigger>
                    <TabsTrigger value="user-management">User Management</TabsTrigger>
                    <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
                    <TabsTrigger value="global-settings">Global Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>Super Admin Dashboard</CardTitle>
                            <CardDescription>Full control of the platform. Oversee all operations, users, and configurations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleTabChange('user-management')}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{users?.length || 0}</div>}
                                        <p className="text-xs text-muted-foreground">Across all roles</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingSellers ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{sellers?.length || 0}</div>}
                                        <p className="text-xs text-muted-foreground">Verified & pending</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingBuyers ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{buyers?.length || 0}</div>}
                                        <p className="text-xs text-muted-foreground">Registered buyers</p>
                                    </CardContent>
                                </Card>
                                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleTabChange('activity-log')}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingAlerts ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                                            <div className={`text-2xl font-bold ${criticalAlerts && criticalAlerts.length > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                                {criticalAlerts?.length || 0}
                                            </div>
                                        }
                                        <p className="text-xs text-muted-foreground">New critical issues</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingProducts ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{products?.length || 0}</div>}
                                        <p className="text-xs text-muted-foreground">Published items</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingOrders ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{orders?.length || 0}</div>}
                                        <p className="text-xs text-muted-foreground">Across all time</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
                                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">+15</div>
                                        <p className="text-xs text-muted-foreground">10 Buyers, 5 Sellers (mock)</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Live Visitors</CardTitle>
                                        <Signal className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">N/A</div>
                                        <p className="text-xs text-muted-foreground">Requires analytics integration</p>
                                    </CardContent>
                                </Card>
                            </div>
                            {criticalAlerts && criticalAlerts.length > 0 && (
                                <Card className="border-destructive">
                                    <CardHeader>
                                        <CardTitle className="text-destructive flex items-center gap-2">
                                            <ShieldAlert /> Critical System Alerts
                                        </CardTitle>
                                        <CardDescription>The following issues require immediate attention.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Message</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Time</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {criticalAlerts.map(alert => (
                                                    <TableRow key={alert.id}>
                                                        <TableCell className="font-medium">{alert.message}</TableCell>
                                                        <TableCell><Badge variant="destructive">{alert.type}</Badge></TableCell>
                                                        <TableCell className="text-xs">{new Date(alert.timestamp?.seconds * 1000).toLocaleTimeString()}</TableCell>
                                                        <TableCell className="space-x-2">
                                                            <Button size="sm">Acknowledge</Button>
                                                            <Button size="sm" variant="outline">View Details</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="user-management">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Role Management</CardTitle>
                            <CardDescription>Assign roles and manage permissions for all users on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Customer Roles</h3>
                                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {customerRoles.map((role) => (
                                        <RoleCard key={role.name} title={role.name} count={role.count} isLoading={role.isLoading} onAddUser={() => handleAddUserClick({name: role.name, value: role.value})} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Administrative Roles</h3>
                                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {adminRoles.map((role) => (
                                        <RoleCard key={role.name} title={role.name} count={role.count} isLoading={role.isLoading} onAddUser={() => handleAddUserClick({name: role.name, value: role.value})} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">TradPay & TradCoin Roles</h3>
                                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {tradpayRoles.map((role) => (
                                        <RoleCard key={role.name} title={role.name} count={role.count} isLoading={role.isLoading} onAddUser={() => handleAddUserClick({name: role.name, value: role.value})} />
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-dashed flex flex-col items-center justify-center text-center p-4 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-[60px]">
                                    <h4 className="font-semibold text-sm">Create New Role</h4>
                            </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity-log">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Activity Log</CardTitle>
                            <CardDescription>A real-time feed of all significant administrative actions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Action</TableHead>
                                        <TableHead className="w-[40%]">Details</TableHead>
                                        <TableHead>Admin User</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderLogRows()}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="global-settings">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Platform-Wide Settings</CardTitle><CardDescription>Manage global configurations and feature flags.</CardDescription></CardHeader>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Fee Management</CardTitle><CardDescription>Configure platform transaction fees.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup value={feeType} onValueChange={(value: 'percentage' | 'fixed') => setFeeType(value)}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="percentage" id="r-percentage" />
                                        <Label htmlFor="r-percentage">Percentage Fee</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="fixed" id="r-fixed" />
                                        <Label htmlFor="r-fixed">Fixed Amount Fee</Label>
                                    </div>
                                </RadioGroup>
                                <div className="grid gap-2 max-w-xs">
                                     <Label htmlFor="fee-value">Fee Value {feeType === 'percentage' ? '(%)' : '(KES)'}</Label>
                                     <Input id="fee-value" type="number" value={feeValue} onChange={e => setFeeValue(Number(e.target.value))} />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleFeeSave} disabled={isSavingFee}>
                                    {isSavingFee && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Save Fee Structure
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Feature Flags</CardTitle></CardHeader>
                            <CardContent>
                                {isLoadingSettings ? <Skeleton className="h-24 w-full" /> : (
                                    <div className="space-y-4">
                                        <AlertDialog>
                                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="allow-unverified-upload" className={cn(platformSettings?.allowUnverifiedUploads ? 'text-green-600' : 'text-destructive')}>
                                                        Product Uploads for Unverified Sellers are currently {platformSettings?.allowUnverifiedUploads ? 'ENABLED' : 'DISABLED'}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        This switch controls whether new sellers can add products before their profile is fully verified.
                                                    </p>
                                                </div>
                                                <AlertDialogTrigger asChild>
                                                    <Switch id="allow-unverified-upload" checked={platformSettings?.allowUnverifiedUploads || false} />
                                                </AlertDialogTrigger>
                                            </div>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Action: {platformSettings?.allowUnverifiedUploads ? "Disable" : "Enable"} Unverified Uploads?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {platformSettings?.allowUnverifiedUploads 
                                                            ? "By disabling this, new sellers must be fully verified before they can upload any products. This enhances quality control but may slow down onboarding."
                                                            : "By enabling this, new sellers can upload products immediately after signing up. These products will have limited visibility until the seller is verified."
                                                        }
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleSettingChange('allowUnverifiedUploads', !platformSettings?.allowUnverifiedUploads)}>
                                                        Confirm
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                         <AlertDialog>
                                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="enable-tradinta-direct" className={cn(platformSettings?.enableTradintaDirect ? 'text-green-600' : 'text-destructive')}>
                                                        Tradinta Direct (B2C) is currently {platformSettings?.enableTradintaDirect ? 'ENABLED' : 'DISABLED'}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                       This switch controls all B2C functionality, including product listings and checkout.
                                                    </p>
                                                </div>
                                                <AlertDialogTrigger asChild>
                                                    <Switch id="enable-tradinta-direct" checked={platformSettings?.enableTradintaDirect ?? true} />
                                                </AlertDialogTrigger>
                                            </div>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Action: {platformSettings?.enableTradintaDirect ? "Disable" : "Enable"} Tradinta Direct?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {platformSettings?.enableTradintaDirect 
                                                            ? "Disabling this will hide the 'Direct' tab, prevent sellers from listing B2C products, and turn off B2C checkout. The platform will operate in B2B mode only."
                                                            : "Enabling this will reactivate all Tradinta Direct features for sellers and customers."
                                                        }
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleSettingChange('enableTradintaDirect', !(platformSettings?.enableTradintaDirect ?? true))}>
                                                        Confirm
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="enable-points-system" className={cn(platformSettings?.enablePointsSystem !== false ? 'text-green-600' : 'text-destructive')}>
                                                        TradPoints System is currently {platformSettings?.enablePointsSystem !== false ? 'ENABLED' : 'DISABLED'}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                       This is a global killswitch for the entire points earning and spending system.
                                                    </p>
                                                </div>
                                                <AlertDialogTrigger asChild>
                                                    <Switch id="enable-points-system" checked={platformSettings?.enablePointsSystem !== false} />
                                                </AlertDialogTrigger>
                                            </div>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Action: {platformSettings?.enablePointsSystem !== false ? "Disable" : "Enable"} TradPoints System?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {platformSettings?.enablePointsSystem !== false
                                                            ? "Disabling this will prevent ALL users from earning or spending points. This is a system-wide action. Use with caution."
                                                            : "This will re-enable the TradPoints system for all users who are not individually banned."
                                                        }
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleSettingChange('enablePointsSystem', !(platformSettings?.enablePointsSystem !== false))}>
                                                        Confirm
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                         <Card className="border-destructive">
                            <CardHeader>
                                <CardTitle className="text-destructive">System Maintenance</CardTitle>
                                <CardDescription>These are high-impact actions. Proceed with caution.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-row items-center justify-between rounded-lg border border-destructive/50 p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
                                        <p className="text-xs text-destructive/80">This will make the entire public-facing site unavailable to visitors and non-admin users.</p>
                                    </div>
                                    <Switch id="maintenance-mode" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}


export default function SuperAdminDashboard() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SuperAdminDashboardContent />
        </React.Suspense>
    )
}
