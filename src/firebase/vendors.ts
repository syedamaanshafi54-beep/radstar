import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    Timestamp,
    serverTimestamp,
    Firestore
} from 'firebase/firestore';
import type { Vendor, VendorDiscountHistory, VendorLocation, BulkDiscountTier } from '@/lib/types';

/**
 * Create a new vendor application
 */
export async function createVendorApplication(
    firestore: Firestore,
    userId: string,
    businessName: string,
    businessType: 'Retailer' | 'Wholesaler' | 'Distributor' | 'Other',
    phone: string,
    email: string,
    location: VendorLocation
): Promise<string> {
    const vendorData: Omit<Vendor, 'id'> = {
        userId,
        businessName,
        businessType,
        phone,
        email,
        location,
        defaultDiscount: 0, // Will be set by admin on approval
        status: 'pending',
        appliedAt: serverTimestamp() as Timestamp,
    };

    console.log('Creating vendor with data:', {
        ...vendorData,
        appliedAt: 'serverTimestamp()'
    });

    try {
        const docRef = await addDoc(collection(firestore, 'vendors'), vendorData);
        console.log('Vendor created successfully with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error in createVendorApplication:', error);
        throw error;
    }
}

/**
 * Check if user has a pending vendor application
 */
export async function hasPendingVendorApplication(firestore: Firestore, userId: string): Promise<boolean> {
    const q = query(
        collection(firestore, 'vendors'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

/**
 * Get vendor by user ID
 */
export async function getVendorByUserId(firestore: Firestore, userId: string): Promise<Vendor | null> {
    const q = query(
        collection(firestore, 'vendors'),
        where('userId', '==', userId),
        where('status', '==', 'approved')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Vendor;
}

/**
 * Get vendor by vendor ID
 */
export async function getVendorById(firestore: Firestore, vendorId: string): Promise<Vendor | null> {
    const docRef = doc(firestore, 'vendors', vendorId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as Vendor;
}

/**
 * Calculate vendor discount for a product
 * Returns the discount percentage to apply
 */
export function getVendorDiscount(
    vendor: Vendor,
    productId: string,
    quantity?: number
): number {
    // Start with default discount
    let discount = vendor.defaultDiscount || 0;

    // Add product-specific discount if it exists
    if (vendor.productDiscounts?.[productId]) {
        discount += vendor.productDiscounts[productId];
    }

    // Check bulk discount tiers if quantity is provided
    if (quantity && vendor.bulkDiscountTiers && vendor.bulkDiscountTiers.length > 0) {
        const applicableTiers = vendor.bulkDiscountTiers
            .filter(tier => quantity >= tier.minQuantity)
            .sort((a, b) => b.minQuantity - a.minQuantity);

        if (applicableTiers.length > 0 && applicableTiers[0].discount > discount) {
            discount = applicableTiers[0].discount;
        }
    }

    return discount;
}

/**
 * Calculate vendor price for a product
 */
export function calculateVendorPrice(
    salePrice: number,
    vendor: Vendor,
    productId: string,
    quantity?: number
): number {
    const discount = getVendorDiscount(vendor, productId, quantity);
    return salePrice * (1 - discount / 100);
}

/**
 * Log discount change to history
 */
export async function logDiscountChange(
    firestore: Firestore,
    vendorId: string,
    vendorName: string,
    changeType: 'default' | 'product' | 'bulk_tier',
    previousValue: any,
    newValue: any,
    changedBy: string,
    changedByName: string,
    productId?: string,
    productName?: string,
    notes?: string
): Promise<void> {
    const historyData: any = {
        vendorId,
        vendorName,
        changeType,
        previousValue,
        newValue,
        changedBy,
        changedByName,
        changedAt: serverTimestamp() as Timestamp,
    };

    // Only include optional fields if they have values
    if (productId !== undefined) {
        historyData.productId = productId;
    }
    if (productName !== undefined) {
        historyData.productName = productName;
    }
    if (notes !== undefined) {
        historyData.notes = notes;
    }

    await addDoc(collection(firestore, 'vendorDiscountHistory'), historyData);
}

/**
 * Get discount change history for a vendor
 */
export async function getVendorDiscountHistory(firestore: Firestore, vendorId: string): Promise<VendorDiscountHistory[]> {
    const q = query(
        collection(firestore, 'vendorDiscountHistory'),
        where('vendorId', '==', vendorId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorDiscountHistory));
}
