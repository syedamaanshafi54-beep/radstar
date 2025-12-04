
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  setSessionPersistence,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/social-icons';
import { handleGoogleSignIn, getFirstName } from '@/firebase/user-actions';

const emailSchema = z.object({
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

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      onSuccess?.();
    }
  }, [user, isUserLoading, onSuccess]);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsSubmitting(true);
    try {
      await setSessionPersistence(auth, true); // Remember user by default
      await initiateEmailSignUp(auth, values.email, values.password);

      toast({
        title: 'Account created!',
        description: "You're now logged in.",
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
      const userCredential = await handleGoogleSignIn();
      const firstName = getFirstName(userCredential.user);
      
      toast({
        title: `Welcome, ${firstName}!`,
        description: "Your account has been created successfully.",
        duration: 4000,
      });

      onSuccess?.();
    } catch (error: any) {
      if (
        error.code !== 'auth/popup-closed-by-user' &&
        error.code !== 'auth/cancelled-popup-request'
      ) {
        toast({
          variant: 'destructive',
          title: 'Google sign-up failed.',
          description: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isUserLoading || user) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-1">
      <CardHeader className="text-center p-0 mb-3">
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Join us to start your journey to wellness.
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
                className="space-y-3 pt-2"
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          {...field}
                          type="password"
                          disabled={isSubmitting}
                        />
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
                className="space-y-3 pt-2"
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

                <Button className="w-full">
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
