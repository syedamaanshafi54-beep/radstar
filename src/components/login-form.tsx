
'use client';

import { useEffect, useState } from 'react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  useAuth,
  initiateEmailSignIn,
  useUser,
  setSessionPersistence,
  handleGoogleSignIn,
  getFirstName,
  initiatePhoneSignIn,
} from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/social-icons';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SignupForm } from '@/components/signup-form';
import { VendorRegistrationForm } from '@/components/vendor/vendor-registration-form';
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const emailSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  rememberMe: z.boolean().default(false).optional(),
});

const phoneSchema = z.object({
  phone: z.string().length(10, 'Phone number must be exactly 10 digits.'),
});

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isVendorRegOpen, setIsVendorRegOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone Auth State
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otp, setOtp] = useState('');

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      onSuccess?.();
    }
  }, [user, isUserLoading, onSuccess]);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsSubmitting(true);
    try {
      await setSessionPersistence(auth, values.rememberMe);
      const userCredential = await initiateEmailSignIn(auth, values.email, values.password);

      // Check if user is admin and redirect accordingly
      const isAdmin = userCredential.user.email === 'itsmeabdulk@gmail.com' ||
        userCredential.user.email === 'radstar.in@gmail.com';

      toast({
        title: 'Signed in!',
        description: isAdmin ? "Welcome back, Admin!" : "You're now logged in.",
      });

      if (isAdmin) {
        router.push('/admin');
      } else {
        onSuccess?.();
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign in failed.',
          description: error.message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };





  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setIsSubmitting(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          toast({ variant: "destructive", title: "Recaptcha Expired", description: "Please try again." });
        }
      });

      let phoneNumber = values.phone.trim();
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+91${phoneNumber}`;
      }

      const result = await initiatePhoneSignIn(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      toast({
        title: "Code Sent",
        description: `Verification code sent to ${phoneNumber}`,
      });

    } catch (error: any) {
      console.error("Phone Auth Error:", error);
      toast({
        variant: "destructive",
        title: "Failed to send code",
        description: error.message,
      });
      // Reset recaptcha if needed
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then(function (widgetId: any) {
          (window as any).grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setIsSubmitting(true);
    try {
      if (!confirmationResult) return;
      await confirmationResult.confirm(otp);
      toast({
        title: "Signed in!",
        description: "Phone verification successful.",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "The verification code is invalid or expired.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { userCredential, isNewUser } = await handleGoogleSignIn('signin');

      if (isNewUser) {
        toast({
          title: `Welcome!`,
          description: "Let's complete your profile.",
          duration: 4000,
        });
        router.push('/onboarding');
      } else {
        const firstName = getFirstName(userCredential.user);
        toast({
          title: `Welcome back, ${firstName}!`,
          description: "You're now logged in.",
          duration: 4000,
        });
        onSuccess?.();
      }
    } catch (error: any) {
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        // Do nothing, user cancelled.
      } else if (error.message.includes('Account not found')) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Account not found. Please sign up first.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Google sign-in failed.',
          description: 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // If user is already logged in, no need to show the form.
    // The parent component will handle closing the dialog.
    return null;
  }

  return (
    <div className="p-0">
      <CardHeader className="text-center p-0 mb-4">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Choose your preferred login method to continue.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-0">
        <Button
          variant="outline"
          className="w-full"
          onClick={onGoogleSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Sign in with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Form {...emailForm}>
              <form
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-4 pt-2"
              >
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          {...field}
                          type="email"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot Password?
                        </Link>
                      </div>

                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            disabled={isSubmitting}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Remember me</FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In with Email
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="phone">
            <Form {...phoneForm}>
              <form
                onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                className="space-y-4 pt-2"
              >
                {!confirmationResult ? (
                  <>
                    <FormField
                      control={phoneForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="9876543210"
                              {...field}
                              maxLength={10}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div id="recaptcha-container"></div>
                    <Button className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Verification Code
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <FormLabel>Enter Verification Code</FormLabel>
                      <Input
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Code sent to {phoneForm.getValues('phone')}
                      </p>
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      disabled={isSubmitting || otp.length !== 6}
                      onClick={verifyOtp}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify & Sign In
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      disabled={isSubmitting}
                      onClick={() => {
                        setConfirmationResult(null);
                        setOtp('');
                      }}
                    >
                      Change Phone Number
                    </Button>
                  </>
                )}
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 p-0 pt-4">
        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
            <DialogTrigger asChild>
              <button className="font-medium text-primary hover:underline">
                Sign up
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-4 sm:p-5 rounded-xl">
              <DialogHeader>
                <DialogTitle>Create an Account</DialogTitle>
                <DialogDescription>
                  Join us to start your journey to wellness.
                </DialogDescription>
              </DialogHeader>
              <SignupForm
                onSuccess={() => {
                  setIsSignupOpen(false);
                  onSuccess?.();
                }}
              />
            </DialogContent>
          </Dialog>
        </p>

        <p className="text-sm text-center text-muted-foreground">
          Want to become a vendor?{' '}
          <Dialog open={isVendorRegOpen} onOpenChange={setIsVendorRegOpen}>
            <DialogTrigger asChild>
              <button className="font-medium text-primary hover:underline">
                Register as Vendor
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl p-4 sm:p-6 rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Vendor Registration</DialogTitle>
                <DialogDescription>
                  Apply to become a vendor and get special pricing on our products.
                </DialogDescription>
              </DialogHeader>
              <VendorRegistrationForm
                onSuccess={() => {
                  setIsVendorRegOpen(false);
                  onSuccess?.();
                }}
                onCancel={() => setIsVendorRegOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </p>
      </CardFooter>
    </div>
  );
}
