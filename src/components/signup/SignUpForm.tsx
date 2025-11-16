
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Logo } from '@/components/logo';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  KeyRound,
  Building,
  Loader2,
  Info,
  Gift,
} from 'lucide-react';
import {
  resendVerificationEmail,
  handleSignUpAction,
} from '@/app/lib/actions/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { type ProductCategory } from '@/app/lib/data';
import { africanCountries, kenyanCounties } from '@/lib/countries';
import { SignUpRoleSelection } from './SignUpRoleSelection';

export function SignUpForm({
  initialRefCode,
  categories,
}: {
  initialRefCode: string | null;
  categories: ProductCategory[];
}) {
  const [role, setRole] = useState('buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [country, setCountry] = useState('');
  const [county, setCounty] = useState('');
  const [referralCode, setReferralCode] = useState(initialRefCode || '');
  const [isResending, setIsResending] = React.useState(false);
  const [userIdForResend, setUserIdForResend] = React.useState<string | null>(null);

  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!initialRefCode) {
      const storedAttribution = localStorage.getItem('attributionData');
      if (storedAttribution) {
        try {
          const attributionData = JSON.parse(storedAttribution);
          if (attributionData.ref) {
            setReferralCode(attributionData.ref);
          }
        } catch (e) {
          console.error('Could not parse attribution data from localStorage', e);
        }
      }
    }
  }, [initialRefCode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({ title: 'Auth service not available', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please check your passwords and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user in Firebase Auth (Client-side)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setUserIdForResend(user.uid);

      // Set user's display name in Auth profile
      await updateProfile(user, { displayName: fullName });

      // 2. Prepare data for the Server Action
      const storedAttribution = localStorage.getItem('attributionData');
      const attributionData = storedAttribution
        ? JSON.parse(storedAttribution)
        : {};

      const serverActionPayload = {
        userId: user.uid,
        email: user.email!,
        fullName,
        role,
        businessName: role === 'manufacturer' ? businessName : '',
        country,
        county,
        attributionData,
        referralCode: referralCode || attributionData.ref || null,
      };

      // 3. Call the Server Action to handle all backend operations
      const result = await handleSignUpAction(serverActionPayload);

      if (!result.success) {
        throw new Error(result.message || 'An error occurred on the server.');
      }
      
      // 4. Send verification email (client can trigger this server action)
      await resendVerificationEmail(user.uid);
      
      // 5. Clear local storage and update UI
      localStorage.removeItem('attributionData');
      setIsSuccess(true);

    } catch (error: any) {
      console.error("Sign up failed with error:", error);
      toast({
        title: 'Sign up failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResend = async () => {
    if (!userIdForResend) return;
    setIsResending(true);
    const result = await resendVerificationEmail(userIdForResend);
    if (result.success) {
      toast({
        title: "Verification Email Sent",
        description: "A new link has been sent to your email address.",
      });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsResending(false);
  };


  if (isSuccess) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="space-y-8 text-center p-8">
          <Alert>
            <Mail className="h-5 w-5" />
            <AlertTitle className="font-bold text-xl">
              Check Your Inbox!
            </AlertTitle>
            <AlertDescription>
              We've sent a verification link to <strong>{email}</strong>.
              Please click the link in the email to activate your Tradinta
              account. Didn't receive it?
              <Button variant="link" className="p-0 h-auto ml-1" onClick={handleResend} disabled={isResending}>
                 {isResending ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : null}
                 Resend link
              </Button>
            </AlertDescription>
          </Alert>
          <Button asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <Logo className="w-40 mb-4" />
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 font-headline">
          Create your Tradinta Account
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Connect with verified manufacturers, distributors, and buyers.
        </p>
      </div>

      <SignUpRoleSelection role={role} onRoleChange={setRole} />

      <form className="mt-8 space-y-4" onSubmit={handleSignUp}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`relative ${
              role === 'manufacturer' || role === 'buyer' ? '' : 'md:col-span-2'
            }`}
          >
            <Label htmlFor="full-name">Full Name</Label>
            <User className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
            <Input
              id="full-name"
              name="full-name"
              type="text"
              required
              className="mt-1 pl-10"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          {role === 'manufacturer' && (
            <div className="relative">
              <Label htmlFor="business-name">Business Name</Label>
              <Building className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
              <Input
                id="business-name"
                name="business-name"
                type="text"
                required
                className="mt-1 pl-10"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="relative">
          <Label htmlFor="email">Email</Label>
          <Mail className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Label htmlFor="password">Password</Label>
            <KeyRound className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="mt-1 pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[2.4rem] text-muted-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="relative">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <KeyRound className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
            <Input
              id="confirm-password"
              name="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              className="mt-1 pl-10 pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[2.4rem] text-muted-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {(role === 'manufacturer' || role === 'buyer') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                onValueChange={(value) => setCountry(value)}
                value={country}
              >
                <SelectTrigger id="country" className="mt-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {africanCountries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {country === 'Kenya' && (
              <div>
                <Label htmlFor="county">County</Label>
                <Select onValueChange={setCounty} value={county}>
                  <SelectTrigger id="county" className="mt-1">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {kenyanCounties.map((county) => (
                      <SelectItem key={county} value={county.toLowerCase()}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
             {role === 'manufacturer' && (
                <div className="md:col-span-2">
                <Label htmlFor="category">Business Category</Label>
                <Select>
                    <SelectTrigger id="category" className="mt-1">
                    <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                        {category.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            )}
          </div>
        )}
        <div className="relative">
          <Label htmlFor="referral-code">Referral Code (Optional)</Label>
          <Gift className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
          <Input
            id="referral-code"
            name="referral-code"
            type="text"
            className="mt-1 pl-10"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
        </div>
        {country && country !== 'Kenya' && (
          <Alert
            variant="default"
            className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          >
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle>Expanding Soon!</AlertTitle>
            <AlertDescription>
              Tradinta's full seller services are currently optimized for Kenya.
              You can still create an account, and we'll notify you as soon as
              we launch full support in your country.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center">
          <Checkbox id="terms" name="terms" required />
          <Label
            htmlFor="terms"
            className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
          >
            I agree to the{' '}
            <Link
              href="/pages/terms-of-service"
              className="text-blue-600"
            >
              Terms and Conditions
            </Link>
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Login here
        </Link>
      </p>
    </div>
  );
}
