
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { useToast } from '@/hooks/use-toast';

type Partner = {
  id: string;
  fullName: string;
  bio?: string;
  photoURL?: string;
  tradintaId?: string;
};

const PartnerCard = ({ partner }: { partner: Partner }) => {
    const { user, role } = useUser();
    const { toast } = useToast();
    const [myNetwork, setMyNetwork] = useLocalStorageState<Partner[]>('my-partner-network', []);
    const isInNetwork = myNetwork.some(p => p.id === partner.id);

    const handleToggleNetwork = () => {
        if (isInNetwork) {
            setMyNetwork(myNetwork.filter(p => p.id !== partner.id));
            toast({ title: 'Partner Removed', description: `${partner.fullName} has been removed from your network.` });
        } else {
            setMyNetwork([...myNetwork, partner]);
            toast({ title: 'Partner Added!', description: `${partner.fullName} has been added to your network.` });
        }
    }

    return (
        <Card className="overflow-hidden group flex flex-col hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center flex-grow flex flex-col items-center">
                <Link href={`/partner/${partner.tradintaId}`} className="block">
                    <Avatar className="h-24 w-24 mb-4 mx-auto border-4 border-transparent group-hover:border-primary transition-colors">
                        <AvatarImage src={partner.photoURL || `https://i.pravatar.cc/150?u=${partner.id}`} />
                        <AvatarFallback>{partner.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg">{partner.fullName}</h3>
                </Link>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3 flex-grow">{partner.bio || 'Tradinta Growth Partner promoting African manufacturers.'}</p>
            </CardContent>
            <CardContent className="p-4 border-t">
                {role === 'manufacturer' && (
                     <Button variant={isInNetwork ? 'secondary' : 'default'} onClick={handleToggleNetwork} className="w-full">
                        {isInNetwork ? <Check className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {isInNetwork ? 'In My Network' : 'Add to My Network'}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

export default function PartnersHubPage() {
    const firestore = useFirestore();

    const partnersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'partner'), where('isPublic', '==', true));
    }, [firestore]);

    const { data: partners, isLoading } = useCollection<Partner>(partnersQuery);

    return (
        <div className="container mx-auto py-12">
            <div className="text-center mb-12">
                <Users className="mx-auto h-16 w-16 text-primary mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4 mb-4">
                    Tradinta Growth Partner Hub
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Discover and collaborate with our network of verified influencers and marketing experts to amplify your brand's reach.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({length: 8}).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6 text-center flex flex-col items-center">
                                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full mt-1" />
                            </CardContent>
                        </Card>
                    ))
                ) : partners && partners.length > 0 ? (
                    partners.map(partner => <PartnerCard key={partner.id} partner={partner} />)
                ) : (
                     <div className="col-span-full text-center py-24 bg-muted/50 rounded-lg">
                        <h3 className="text-xl font-semibold">No Public Partners Yet</h3>
                        <p className="text-muted-foreground mt-2">
                           Our Growth Partner network is growing. Check back soon to find partners to collaborate with.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
