
'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { Loader2, Home, Package, Shield, Settings, Users, Briefcase, PanelLeft, History } from 'lucide-react';
import { PermissionDenied } from '@/components/ui/permission-denied';
import { hasPermission } from '@/lib/roles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const AdminSidebar = () => {
    const pathname = usePathname();
    const searchParams = React.useMemo(() => new URLSearchParams(window.location.search), [pathname]);
    const activeTab = searchParams.get('tab') || 'onboarding';
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const navItems = [
        { href: 'onboarding', label: 'Onboarding Queue', icon: Users },
        { href: 'shop-management', label: 'Shop Management', icon: Briefcase },
        { href: 'job-postings', label: 'Job Postings', icon: Package },
        { href: 'activity-log', label: 'Activity Log', icon: History },
        { href: 'support-resources', label: 'Support & Training', icon: Shield },
    ];

    return (
        <div className={cn("hidden border-r bg-muted/40 md:block transition-all duration-300", isCollapsed ? "w-[60px]" : "w-[220px] lg:w-[280px]")}>
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/dashboards/admin" className="flex items-center gap-2 font-semibold">
                        <Logo className="h-6 w-auto" />
                        {!isCollapsed && <span className="transition-opacity duration-300">Admin</span>}
                    </Link>
                    <Button variant="outline" size="icon" className="ml-auto h-8 w-8" onClick={() => setIsCollapsed(!isCollapsed)}>
                        <PanelLeft className="h-4 w-4" />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <nav className={cn("grid items-start text-sm font-medium", isCollapsed ? "px-2" : "px-2 lg:px-4")}>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={`/dashboards/admin?tab=${item.href}`}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                    activeTab === item.href && "bg-muted text-primary"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {!isCollapsed && <span className="transition-opacity duration-300">{item.label}</span>}
                            </Link>
                        ))}
                    </nav>
                </ScrollArea>
            </div>
        </div>
    );
};


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading, role } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }
  
  const hasAccess = role === 'admin' || role === 'super-admin';

  if (!hasAccess) {
    return <PermissionDenied />;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
        <AdminSidebar />
        <div className="flex flex-col">
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
            </main>
        </div>
    </div>
  );
}
