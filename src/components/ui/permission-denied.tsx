
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useUser } from '@/firebase';
import { Badge } from './badge';
import { Combobox, type ComboboxOption } from './combobox';
import { ROLES } from '@/lib/roles';
import { setUserRoleClaim } from '@/app/lib/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export function PermissionDenied() {
  const { user, role } = useUser();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = React.useState(role || '');
  const [isChanging, setIsChanging] = React.useState(false);

  const roleOptions: ComboboxOption[] = Object.keys(ROLES).map(key => ({
    value: key,
    label: ROLES[key].name,
  }));

  React.useEffect(() => {
    if (role) {
        setSelectedRole(role);
    }
  }, [role]);

  const handleRoleChange = async () => {
    if (!user || !selectedRole || selectedRole === role) {
        return;
    }
    setIsChanging(true);
    try {
        const result = await setUserRoleClaim(user.uid, selectedRole);
        if (result.success) {
            toast({
                title: 'Role Changed!',
                description: `You are now a ${ROLES[selectedRole]?.name || 'user'}. The page will now reload.`,
            });
            // Hard reload to ensure new token claims are picked up
            setTimeout(() => window.location.reload(), 1500);
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({
            title: 'Failed to Change Role',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
        setIsChanging(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-background text-center p-4">
      <Logo className="w-48 mb-8" />
      <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
      <h1 className="text-2xl md:text-3xl font-bold font-headline mb-4">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Your current role does not have the necessary permissions to view this page. If you believe this is an error, please contact your administrator.
      </p>

       {role && (
        <div className="mb-8">
            <p className="text-sm text-muted-foreground">Your current role:</p>
            <Badge variant="outline" className="text-lg mt-1">{ROLES[role]?.name || role}</Badge>
        </div>
      )}

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboards/buyer">Go to My Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to Homepage</Link>
        </Button>
      </div>

      {/* --- Development Only Section --- */}
      {process.env.NODE_ENV === 'development' && user && (
        <Card className="max-w-md w-full mt-12 text-left">
            <CardHeader>
                <CardTitle>Development Role Switcher</CardTitle>
                <CardDescription>
                    This panel is for development purposes only. Select a role and click "Change Role" to test different user permissions.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
                <div className="flex-grow">
                    <Combobox
                        options={roleOptions}
                        value={selectedRole}
                        onValueChange={setSelectedRole}
                        placeholder="Select a role..."
                    />
                </div>
                <Button onClick={handleRoleChange} disabled={isChanging || selectedRole === role}>
                    {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Role
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
