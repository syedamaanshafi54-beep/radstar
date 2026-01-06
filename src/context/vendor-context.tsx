'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getVendorByUserId, calculateVendorPrice, getVendorDiscount } from '@/firebase/vendors';
import type { Vendor } from '@/lib/types';

interface VendorContextType {
    vendor: Vendor | null;
    isVendor: boolean;
    loading: boolean;
    error: string | null;
    getPrice: (salePrice: number, productId: string, quantity?: number) => number;
    getDiscount: (productId: string, quantity?: number) => number;
    getDiscountAmount: (salePrice: number, productId: string, quantity?: number) => number;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export function VendorProvider({ children }: { children: ReactNode }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVendor() {
            if (isUserLoading) return;

            if (!user) {
                setVendor(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // 1. Direct check from user profile
                const userDocRef = doc(firestore, 'users', user.uid);
                const userSnap = await getDoc(userDocRef);
                const userProfile = userSnap.data();

                if (userProfile?.vendorId) {
                    const vendorDocRef = doc(firestore, 'vendors', userProfile.vendorId);
                    const vendorSnap = await getDoc(vendorDocRef);

                    if (vendorSnap.exists()) {
                        const vendorData = { id: vendorSnap.id, ...vendorSnap.data() } as Vendor;
                        if (vendorData.status === 'approved') {
                            setVendor(vendorData);
                            setError(null);
                            setLoading(false);
                            return;
                        }
                    }
                }

                // 2. Query fallback
                const vendorData = await getVendorByUserId(firestore, user.uid);
                setVendor(vendorData);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching vendor:', err);
                setError(err.message || 'Failed to load vendor information');
                setVendor(null);
            } finally {
                setLoading(false);
            }
        }

        fetchVendor();
    }, [user, isUserLoading, firestore]);

    const getPrice = (salePrice: number, productId: string, quantity?: number): number => {
        if (!vendor) return salePrice;
        return calculateVendorPrice(salePrice, vendor, productId, quantity);
    };

    const getDiscount = (productId: string, quantity?: number): number => {
        if (!vendor) return 0;
        return getVendorDiscount(vendor, productId, quantity);
    };

    const getDiscountAmount = (salePrice: number, productId: string, quantity?: number): number => {
        if (!vendor) return 0;
        const discount = getVendorDiscount(vendor, productId, quantity);
        return salePrice * (discount / 100);
    };

    return (
        <VendorContext.Provider value={{
            vendor,
            isVendor: !!vendor,
            loading,
            error,
            getPrice,
            getDiscount,
            getDiscountAmount
        }}>
            {children}
        </VendorContext.Provider>
    );
}

export function useVendorContext() {
    const context = useContext(VendorContext);
    if (context === undefined) {
        throw new Error('useVendorContext must be used within a VendorProvider');
    }
    return context;
}
