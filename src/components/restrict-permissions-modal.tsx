'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useFirestore, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-log';
import { PERMISSIONS } from '@/lib/permissions';
import { ROLES } from '@/lib/roles';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

interface RestrictPermissionsModalProps {
  userId: string;
  userName: string;
  userRole: string;
  currentRestrictions: string[];
}

type GroupedPermissions = {
  [group: string]: { key: string, name: string }[];
};

export function RestrictPermissionsModal({
  userId,
  userName,
  userRole,
  currentRestrictions,
}: RestrictPermissionsModalProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(new Set());

  // Derive the full list of permissions for the user's role
  const rolePermissions = React.useMemo(() => {
    const role = ROLES[userRole];
    if (!role) return [];
    
    // For now, we handle '*' as all permissions. A more robust solution would expand this.
    if (role.permissions.includes('*')) {
      return Object.values(PERMISSIONS).flatMap(group => Object.values(group));
    }
    
    const getPermissionsForRole = (roleName: string, processedRoles = new Set<string>()): string[] => {
      if (processedRoles.has(roleName)) return []; // Avoid circular dependencies
      processedRoles.add(roleName);

      const roleDef = ROLES[roleName];
      if (!roleDef) return [];

      let permissions = [...roleDef.permissions];
      if (roleDef.inherits) {
        roleDef.inherits.forEach(inheritedRole => {
          permissions.push(...getPermissionsForRole(inheritedRole, processedRoles));
        });
      }
      return permissions;
    }

    return [...new Set(getPermissionsForRole(userRole))];
  }, [userRole]);

  // Group permissions by resource for display
  const groupedPermissions = React.useMemo<GroupedPermissions>(() => {
    const groups: GroupedPermissions = {};
    rolePermissions.forEach(permissionKey => {
      const [resource, action] = permissionKey.split(':');
      const groupName = resource.charAt(0).toUpperCase() + resource.slice(1).replace(/([A-Z])/g, ' $1');
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push({ key: permissionKey, name: permissionKey });
    });
    return groups;
  }, [rolePermissions]);

  // Initialize selected permissions when the modal opens
  React.useEffect(() => {
    if (open) {
      const allowedPermissions = rolePermissions.filter(p => !currentRestrictions.includes(p));
      setSelectedPermissions(new Set(allowedPermissions));
    }
  }, [open, rolePermissions, currentRestrictions]);
  
  const handleTogglePermission = (permission: string, checked: boolean) => {
    setSelectedPermissions(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(permission);
        } else {
            newSet.delete(permission);
        }
        return newSet;
    });
  }

  const handleSave = async () => {
    if (!firestore || !auth) return;
    setIsSaving(true);
    
    const restrictedPermissions = rolePermissions.filter(p => !selectedPermissions.has(p));
    const userDocRef = doc(firestore, 'users', userId);

    try {
        await updateDoc(userDocRef, { restrictedPermissions });

        await logActivity(
            firestore,
            auth,
            'USER_RESTRICTIONS_UPDATED',
            `Updated restrictions for ${userName} (ID: ${userId}). New restrictions: [${restrictedPermissions.join(', ')}]`
        );
        
        toast({
            title: 'Permissions Updated',
            description: `Restrictions for ${userName} have been saved.`,
        });
        setOpen(false);
    } catch (error: any) {
        console.error("Failed to save restrictions:", error);
        toast({
            title: 'Save Failed',
            description: 'Could not update user permissions. ' + error.message,
            variant: 'destructive',
        })
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
            <ShieldAlert className="mr-2 h-4 w-4" /> Restrict Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Restrict Permissions for {userName}</DialogTitle>
          <DialogDescription>
            Uncheck any action to restrict the user from performing it, overriding their "{userRole}" role permissions.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
            <div className="space-y-4 pr-6">
            {Object.entries(groupedPermissions).map(([groupName, permissions]) => (
                <div key={groupName} className="space-y-2">
                    <h4 className="font-semibold text-sm">{groupName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pl-4">
                        {permissions.map(({ key, name }) => (
                            <div key={key} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={key}
                                    checked={selectedPermissions.has(key)}
                                    onCheckedChange={(checked) => handleTogglePermission(key, !!checked)}
                                />
                                <Label htmlFor={key} className="text-xs font-normal text-muted-foreground">{name}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            </div>
        </ScrollArea>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Restrictions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
