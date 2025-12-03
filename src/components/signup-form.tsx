'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
  initiateGoogleSignIn,
  setSessionPersistence,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/social-icons';

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

  // -------- Email Sign Up -------- //
  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsSubmitting(true);
    try {
      await setSessionPersistence(auth, true);
      await initiateEmailSignUp(auth, values.email, values.password);

      toast({
        title: 'Account created!',
        description: "You're now logged in.",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign up failed.',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------- Phone Sign Up (future) -------- //
  const onPhoneSubmit = (values: z.infer<typeof phoneSchema>) => {
    console.log('Phone signup attempt:', values);
    toast({
      title: 'Coming Soon!',
      description: 'Phone sign-up is not yet available.',
    });
  };

  // -------- Google Sign Up -------- //
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await setSessionPersistence(auth, true);

      const userCredential = await initiateGoogleSignIn(auth);
      const firstName =
        userCredential.user.displayName?.split(' ')[0] || 'there';

      toast({
        title: `Welcome, ${firstName} 👋`,
        description: 'Your account has been created.',
        duration: 4000,
      });

      onSuccess?.();
    } catch (error: any) {
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        // ignore — user closed popup
      } else {
        toast({
          variant: 'destructive',
          title: 'Google sign-up failed.',
          description: error.message,
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
    <Card className="w-full max-w-md shadow-none border-0 p-0">
      <CardHeader className="p-0">
        <CardTitle className="text-xl">Create an Account</CardTitle>
        <CardDescription className="text-sm">
          Join us to start your journey.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-0 pt-3">
        {/* Google Signup */}
        <Button
          variant="outline"
          className="w-full h-10 text-sm"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Sign up with Google
        </Button>

        {/* Divider */}
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

        {/* Tabs */}
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 text-sm">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          {/* Email Signup */}
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
                      <FormLabel className="text-sm">Email</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9 text-sm"
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
                      <FormLabel className="text-sm">Password</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9 text-sm"
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
                  className="w-full h-10 text-sm"
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

          {/* Phone Signup */}
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
                      <FormLabel className="text-sm">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9 text-sm"
                          placeholder="+91 12345 67890"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full h-10 text-sm">
                  Send Code
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
