"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function OrderSuccessAnimation() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    duration: 0.5
                }}
                className="relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48 rounded-full bg-green-100 border-4 border-green-500 shadow-2xl"
            >
                <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut"
                    }}
                >
                    <Check className="w-16 h-16 md:w-24 md:h-24 text-green-600" strokeWidth={3} />
                </motion.div>

                {/* Success Rings */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full border-2 border-green-400"
                />
            </motion.div>

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-2xl md:text-4xl font-headline font-bold text-green-800"
            >
                Order Placed Successfully!
            </motion.h2>
            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-2 text-muted-foreground font-medium"
            >
                Taking you to your receipt...
            </motion.p>
        </div>
    );
}
