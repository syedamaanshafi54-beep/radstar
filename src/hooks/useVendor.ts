'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getVendorByUserId, calculateVendorPrice, getVendorDiscount } from '@/firebase/vendors';
import type { Vendor } from '@/lib/types';

/**
 * Hook to get vendor information for the current user
 */
export function useVendor() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVendor() {
            if (!user) {
                setVendor(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // 1. First, check if the user profile has a direct link to a vendorId
                const userDocRef = doc(firestore, 'users', user.uid);
                const userSnap = await getDoc(userDocRef);
                const userProfile = userSnap.data();

                if (userProfile?.vendorId) {
                    console.debug('[useVendor] Found vendorId in profile:', userProfile.vendorId);
                    const vendorDocRef = doc(firestore, 'vendors', userProfile.vendorId);
                    const vendorSnap = await getDoc(vendorDocRef);

                    if (vendorSnap.exists()) {
                        const vendorData = { id: vendorSnap.id, ...vendorSnap.data() } as Vendor;
                        // Only use if approved
                        if (vendorData.status === 'approved') {
                            setVendor(vendorData);
                            setError(null);
                            setLoading(false);
                            return;
                        }
                    }
                }

                // 2. Fallback to query if no vendorId in profile or direct fetch failed
                console.debug('[useVendor] Falling back to query for userId:', user.uid);
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
    }, [user, firestore]);

    return { vendor, loading, error, isVendor: !!vendor };
}

/**
 * Hook to calculate vendor pricing for products
 */
export function useVendorPricing() {
    const { vendor, isVendor } = useVendor();

    const getPrice = (salePrice: number, productId: string, quantity?: number): number => {
        if (!isVendor || !vendor) {
            return salePrice;
        }

        return calculateVendorPrice(salePrice, vendor, productId, quantity);
    };

    const getDiscount = (productId: string, quantity?: number): number => {
        if (!isVendor || !vendor) {
            return 0;
        }

        return getVendorDiscount(vendor, productId, quantity);
    };

    const getDiscountAmount = (salePrice: number, productId: string, quantity?: number): number => {
        if (!isVendor || !vendor) {
            return 0;
        }

        const discount = getVendorDiscount(vendor, productId, quantity);
        return salePrice * (discount / 100);
    };

    return {
        isVendor,
        vendor,
        getPrice,
        getDiscount,
        getDiscountAmount,
    };
}
