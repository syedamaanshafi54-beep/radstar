'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getVendorByUserId, calculateVendorPrice, getVendorDiscount } from '@/firebase/vendors';
import type { Vendor } from '@/lib/types';

import { useVendorContext } from '@/context/vendor-context';

/**
 * Hook to get vendor information for the current user (Now uses context)
 */
export function useVendor() {
    const { vendor, isVendor, loading, error } = useVendorContext();
    return { vendor, isVendor, loading, error };
}

/**
 * Hook to calculate vendor pricing for products (Now uses context)
 */
export function useVendorPricing() {
    const { isVendor, vendor, getPrice, getDiscount, getDiscountAmount } = useVendorContext();

    return {
        isVendor,
        vendor,
        getPrice,
        getDiscount,
        getDiscountAmount,
    };
}
