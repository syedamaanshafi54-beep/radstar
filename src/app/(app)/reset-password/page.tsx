
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const resetSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const oobCode = searchParams.get('oobCode');

    const form = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    useEffect(() => {
        if (!oobCode) {
            setError('Invalid or missing password reset code.');
            setIsValidating(false);
            return;
        }

        // Initialize Firebase client
        const { auth } = initializeFirebase();

        verifyPasswordResetCode(auth, oobCode)
            .then((email) => {
                setEmail(email);
                setIsValidating(false);
            })
            .catch((error) => {
                console.error('Error verifying reset code:', error);
                setError('This link is invalid or has expired. Please request a new password reset link.');
                setIsValidating(false);
            });
    }, [oobCode]);

    const onSubmit = async (values: z.infer<typeof resetSchema>) => {
        if (!oobCode) return;
        setIsSubmitting(true);
        try {
            const { auth } = initializeFirebase();
            await confirmPasswordReset(auth, oobCode, values.password);
            setIsSuccess(true);
            toast({
                title: 'Password successfully reset',
                description: 'You can now log in with your new password.',
            });
        } catch (error: any) {
            console.error('Error resetting password:', error);
            toast({
                variant: 'destructive',
                title: 'Error resetting password',
                description: error.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isValidating) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Validating your request...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="w-full max-w-md border-red-100">
                <CardHeader>
                    <CardTitle className="text-destructive">Invalid Link</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20" variant="outline">
                        <Link href="/forgot-password">Request New Link</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md border-green-100 bg-green-50/10">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Password Updated!</CardTitle>
                    <CardDescription>
                        Your account security is back on track.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                        <Link href="/login">Return to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md shadow-lg border-primary/10">
            <CardHeader>
                <CardTitle className="text-2xl">Create New Password</CardTitle>
                <CardDescription>
                    Setting a new password for <span className="font-semibold text-foreground">{email}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                placeholder="••••••••"
                                                {...field}
                                                type={showPassword ? 'text' : 'password'}
                                                disabled={isSubmitting}
                                                className="pr-10 h-11"
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
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                placeholder="••••••••"
                                                {...field}
                                                type={showPassword ? 'text' : 'password'}
                                                disabled={isSubmitting}
                                                className="pr-10 h-11"
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
                            className="w-full h-11 text-base"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Save New Password"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="container mx-auto flex min-h-[85vh] items-center justify-center px-4 py-8">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
