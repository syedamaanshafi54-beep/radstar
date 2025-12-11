
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardFooter,
} from '@/components/ui/card';
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
import {
  useAuth,
  initiateEmailSignUp,
  useUser,
  updateUserProfile,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/social-icons';
import { handleGoogleSignIn, getFirstName } from '@/firebase/user-actions';
import { useRouter } from 'next/navigation';
import { UserCredential } from 'firebase/auth';

const emailSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number.'),
});

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      // If a user is successfully created, the onSuccess callback or a redirect will be triggered.
      // If they land here while logged in, it's likely after a signup flow.
      onSuccess?.();
    }
  }, [user, isUserLoading, onSuccess]);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const handleNewUser = async (userCredential: UserCredential, isNew: boolean) => {
     if (isNew) {
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
  }


  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsSubmitting(true);
    try {
      const userCredential = await initiateEmailSignUp(auth, values.email, values.password);
      // Pass all relevant info to be stored in Firestore
      await updateUserProfile(userCredential.user, {
        displayName: values.displayName,
        email: values.email,
      });

      toast({
        title: 'Account created!',
        description: `Welcome, ${getFirstName(userCredential.user)}!`,
      });

      onSuccess?.();

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'destructive',
          title: 'Email Already Registered',
          description: 'This email address is already in use. Please try logging in.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign up failed.',
          description: error.message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPhoneSubmit = (values: z.infer<typeof phoneSchema>) => {
    console.log('Phone signup attempt:', values);
    toast({
      title: 'Coming Soon!',
      description: 'Phone sign-up is not yet available.',
    });
  };

  const onGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { userCredential, isNewUser } = await handleGoogleSignIn('signup');
      handleNewUser(userCredential, isNewUser);
    } catch (error: any) {
      if (
        error.code !== 'auth/popup-closed-by-user' &&
        error.code !== 'auth/cancelled-popup-request'
      ) {
        toast({
          variant: 'destructive',
          title: 'Google sign-up failed.',
          description: 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isUserLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-1">
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
          Sign up with Google
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
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel>Password</FormLabel>
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign Up with Email
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
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+91 12345 67890"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full" disabled>
                  Send Code
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
       <CardFooter className="flex justify-center p-0 pt-3">
          <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our Terms of Service.
          </p>
      </CardFooter>
    </div>
  );
}
