'use client';

import { useUser, updateUserProfile, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';

const onboardingSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().min(10, 'Please enter a valid phone number.').optional(),
  address: z.string().min(10, 'Please enter a valid address.').optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      phone: '',
      address: '',
    },
  });

  // Effect to handle redirection and check profile status
  useEffect(() => {
    if (!isUserLoading && !user) {
      // If not loading and no user, redirect to login
      router.replace('/login');
    } else if (!isUserLoading && user && firestore) {
      // If user is loaded, check if they even need to be here
      const checkProfile = async () => {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().isProfileComplete) {
          // If profile is already complete, redirect away
          toast({
            title: "You're all set!",
            description: 'Your profile is already complete.',
          });
          router.replace('/');
        } else {
            // Pre-fill form with any existing data
            const data = userSnap.data();
            form.setValue('displayName', user.displayName || data?.displayName || '');
            form.setValue('phone', data?.phone || '');
            form.setValue('address', data?.address || '');
        }
      };
      checkProfile();
    }
  }, [user, isUserLoading, router, firestore, toast, form]);


  const onSubmit = async (values: OnboardingFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateUserProfile(user, {
        displayName: values.displayName,
        phone: values.phone,
        address: values.address,
      });

      toast({
        title: 'Profile complete!',
        description: 'Welcome to Rad Star Trading!',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update profile',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Just a few more details and you'll be all set.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your full shipping address for faster checkout."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save and Continue'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
