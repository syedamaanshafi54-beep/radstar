'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Confetti from 'react-confetti';

export default function OrderSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [showConfetti, setShowConfetti] = useState(true);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Stop confetti after 5 seconds
        const confettiTimer = setTimeout(() => {
            setShowConfetti(false);
        }, 5000);

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    router.push('/products');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(confettiTimer);
            clearInterval(countdownInterval);
        };
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-primary/5 px-4">
            {showConfetti && (
                <Confetti
                    width={typeof window !== 'undefined' ? window.innerWidth : 300}
                    height={typeof window !== 'undefined' ? window.innerHeight : 200}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.3}
                />
            )}

            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    duration: 0.6,
                }}
                className="text-center max-w-2xl"
            >
                {/* Success Icon with Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        delay: 0.2,
                        type: 'spring',
                        stiffness: 200,
                        damping: 10,
                    }}
                    className="mb-8 flex justify-center"
                >
                    <div className="relative">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
                        />
                        <CheckCircle className="h-32 w-32 text-green-500 relative z-10" strokeWidth={1.5} />
                    </div>
                </motion.div>

                {/* Success Message */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-green-600">
                        Order Placed Successfully!
                    </h1>
                    <p className="text-xl text-muted-foreground mb-2">
                        Thank you for your purchase
                    </p>
                    {orderId && (
                        <p className="text-sm text-muted-foreground mb-8">
                            Order ID: <span className="font-mono font-semibold">{orderId}</span>
                        </p>
                    )}
                </motion.div>

                {/* Order Details Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-green-100"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Package className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-semibold">What's Next?</h2>
                    </div>
                    <div className="space-y-3 text-left max-w-md mx-auto">
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-green-600 text-sm font-bold">1</span>
                            </div>
                            <p className="text-muted-foreground">
                                You'll receive an order confirmation email shortly
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-green-600 text-sm font-bold">2</span>
                            </div>
                            <p className="text-muted-foreground">
                                We'll notify you when your order is shipped
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-green-600 text-sm font-bold">3</span>
                            </div>
                            <p className="text-muted-foreground">
                                Track your order status in your account
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Button
                        onClick={() => router.push('/account')}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                    >
                        View Order History
                    </Button>
                    <Button
                        onClick={() => router.push('/products')}
                        size="lg"
                        className="gap-2"
                    >
                        Continue Shopping
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </motion.div>

                {/* Auto-redirect countdown */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="mt-8 text-sm text-muted-foreground"
                >
                    Redirecting to products page in {countdown} seconds...
                </motion.p>
            </motion.div>
        </div>
    );
}
