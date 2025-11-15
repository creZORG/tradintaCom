
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import { useFirestore } from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  limit,
} from 'firebase/firestore';
import { setUserRoleClaim } from '@/app/lib/actions/auth';

interface AddUserToRoleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  roleValue: string;
}

export function AddUserToRoleModal({
  isOpen,
  onOpenChange,
  roleName,
  roleValue,
}: AddUserToRoleModalProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [tradintaId, setTradintaId] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tradintaId || !firestore) {
      toast({
        title: 'Error',
        description: 'Please enter a Tradinta ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('tradintaId', '==', tradintaId), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: 'User Not Found',
          description: `No user found with Tradinta ID: ${tradintaId}`,
          variant: 'destructive',
        });
        setIsAdding(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      
      const result = await setUserRoleClaim(userDoc.id, roleValue);

      if (!result.success) {
        throw new Error(result.message || 'Failed to set user role claim.');
      }


      toast({
        title: 'Success!',
        description: `${userDoc.data().fullName} has been assigned the role: ${roleName}.`,
      });

      onOpenChange(false); // Close the modal on success
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Assignment Failed',
        description:
          error.message || 'An error occurred while assigning the role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Reset local state when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setTradintaId('');
      setIsAdding(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add User to "{roleName}"</DialogTitle>
          <DialogDescription>
            Enter the user's 8-character Tradinta ID to grant them this role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tradintaId" className="text-right">
                Tradinta ID
              </Label>
              <Input
                id="tradintaId"
                value={tradintaId}
                onChange={(e) => setTradintaId(e.target.value)}
                className="col-span-3"
                placeholder="e.g. a8B2c3D4"
                maxLength={8}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isAdding ? 'Assigning...' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
