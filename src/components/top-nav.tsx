
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Heart,
  Mail,
  UserPlus,
  Sparkles,
  Wallet,
  Menu,
  ShoppingCart,
  Handshake,
  TrendingUp,
  PackageSearch,
} from 'lucide-react';
import { Logo } from './logo';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  useUser,
  useAuth,
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ModeToggle } from './mode-toggle';
import { collection, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { MobileNav } from './mobile-nav';
import { ROLES } from '@/lib/roles';
import { deleteUserSession } from '@/app/dashboards/buyer/actions';
import { cn } from '@/lib/utils';

function UserMenu() {
  const { user, isUserLoading, role } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth || !user) return;
    const sessionId = sessionStorage.getItem('tradinta-sid');
    if (sessionId) {
      await deleteUserSession(user.uid, sessionId);
      sessionStorage.removeItem('tradinta-sid');
    }
    await signOut(auth);
    router.push('/');
  };

  const conversationsCollectionPath = React.useMemo(() => {
    if (!user) return null;
    return role === 'manufacturer'
      ? `manufacturers/${user.uid}/conversations`
      : `users/${user.uid}/conversations`;
  }, [user, role]);

  const unreadConversationsQuery = useMemoFirebase(() => {
    if (!firestore || !conversationsCollectionPath) return null;
    return query(
      collection(firestore, conversationsCollectionPath),
      where('isUnread', '==', true)
    );
  }, [firestore, conversationsCollectionPath]);

  const { data: unreadConversations } = useCollection(unreadConversationsQuery);
  const hasUnreadMessages = unreadConversations && unreadConversations.length > 0;
  
  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/cart`));
  }, [firestore, user]);
  
  const { data: cartItems } = useCollection(cartQuery);
  const cartItemCount = cartItems?.length || 0;

  const isAdminRole = (role: string | null): boolean => {
    if (!role) return false;
    const adminRoles = ['admin', 'super-admin', 'support', 'operations-manager', 'user-management', 'marketing-manager', 'finance', 'legal-compliance', 'content-management', 'tradinta-direct-admin', 'logistics', 'tradpay-admin', 'tradcoin-airdrop'];
    return adminRoles.includes(role);
  };
  
  const getDashboardUrl = (role: string | null) => {
    switch (role) {
      case 'manufacturer': return '/dashboards/seller-centre';
      case 'buyer': return '/dashboards/buyer';
      case 'partner': return '/dashboards/growth-partner';
      case 'distributor': return '/dashboards/distributor';
      case 'admin': return '/dashboards/admin';
      case 'super-admin': return '/dashboards/super-admin';
      case 'support': return '/dashboards/support';
      case 'operations-manager': return '/dashboards/operations-manager';
      case 'user-management': return '/dashboards/user-management';
      case 'marketing-manager': return '/dashboards/marketing-manager';
      case 'finance': return '/dashboards/finance';
      case 'legal-compliance': return '/dashboards/legal-compliance';
      case 'content-management': return '/dashboards/content-management';
      case 'tradinta-direct-admin': return '/dashboards/tradinta-direct-admin';
      case 'logistics': return '/dashboards/logistics';
      case 'tradpay-admin': return '/dashboards/tradpay-admin';
      case 'tradcoin-airdrop': return '/dashboards/tradcoin-airdrop';
      default: return '/dashboards/buyer';
    }
  }

  const primaryDashboardUrl = getDashboardUrl(role);
  const userIsAdmin = isAdminRole(role);

  if (isUserLoading) {
    return null; // Or a loading spinner
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="relative">
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="sr-only">Cart</span>
                   {cartItemCount > 0 && (
                     <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {cartItemCount}
                    </span>
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>My Cart ({cartItemCount} items)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative"
              >
                <Link
                  href={
                    role === 'manufacturer'
                      ? '/dashboards/seller-centre/messages'
                      : '/dashboards/buyer/messages'
                  }
                >
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
                  {hasUnreadMessages && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Messages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>
                  <div className="relative w-8 h-8">
                    <Image
                      src="https://res.cloudinary.com/dlmvoo4fj/image/upload/v1763113614/ybfdmvcyfjrdhdghnxrx.png"
                      alt="Tradinta Logomark"
                      fill
                      className="object-contain"
                    />
                  </div>
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userIsAdmin ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Dashboards</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link href={primaryDashboardUrl}>My Admin Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboards/buyer">Buyer Dashboard</Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ) : (
               <DropdownMenuItem asChild>
                <Link href={primaryDashboardUrl}>My Tradinta</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild>
              <Link href="/signup">
                <UserPlus className="mr-2" />
                Sign Up
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create an account</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export function TopNav({ wordmarkUrl, logomarkUrl }: { wordmarkUrl?: string | null, logomarkUrl?: string | null }) {
  const [logos, setLogos] = React.useState({
    theFoundryLogoUrl: 'https://i.postimg.cc/VkfCYdsM/image.png',
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={cn("sticky top-0 z-50 w-full transition-all duration-300", isScrolled ? 'p-2' : 'p-4')}>
        <div className={cn(
            "relative container mx-auto flex h-16 items-center justify-between transition-all duration-300 overflow-hidden",
            isScrolled 
                ? 'rounded-2xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg border' 
                : 'bg-transparent'
        )}>
           <div className={cn(
              "absolute inset-0 w-full h-full opacity-0 transition-opacity duration-500"
            )}></div>
          <div className="relative z-10 mr-auto flex items-center gap-4">
             <Logo use="responsive" wordmarkUrl={wordmarkUrl} logomarkUrl={logomarkUrl} className="w-32 h-10" />
            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-4 text-sm md:flex">
                <Link href="/products" className="font-medium text-muted-foreground transition-colors hover:text-primary">
                    Products
                </Link>
                <Link
                    href="/foundry"
                    className="font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1"
                >
                    <Image
                    src={logos.theFoundryLogoUrl}
                    alt="The Foundry"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                    />
                    The Foundry
                </Link>
                <Link href="/tradepay/about" className="flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-primary">
                    <Image src="https://i.postimg.cc/xjZhmYGD/image-Photoroom-1-Photoroom.png" alt="TradePay" width={32} height={32}/>
                    <span>TradePay</span>
                </Link>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="font-medium text-muted-foreground transition-colors hover:text-primary">
                        Grow <ChevronDown className="ml-1 h-4 w-4"/>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                            <Link href="/marketing-plans" className="flex items-center gap-2"><TrendingUp/>Marketing Plans</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/partners" className="flex items-center gap-2"><Handshake/>Growth Partners</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>
          </div>

          {/* Right side controls */}
          <div className="relative z-10 flex shrink-0 items-center justify-end space-x-2">
            <div className="hidden md:flex">
              <UserMenu />
            </div>
            <Separator orientation="vertical" className="h-6 hidden md:flex" />
            <ModeToggle />
            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <MobileNav open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} />
    </>
  );
}
