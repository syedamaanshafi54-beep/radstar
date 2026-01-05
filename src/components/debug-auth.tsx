'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export function DebugAuth() {
    const { user, claims } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (user) {
            console.log('=== AUTH DEBUG ===');
            console.log('User UID:', user.uid);
            console.log('User Email:', user.email);
            console.log('User Display Name:', user.displayName);
            console.log('Role Claim:', claims?.role);

            const testQuery = async () => {
                try {
                    const vendorsRef = collection(firestore, 'vendors');
                    const snapshot = await getDocs(vendorsRef);
                    console.log('✅ SUCCESS! Found', snapshot.size, 'vendors');
                } catch (error: any) {
                    console.error('❌ FAILED:', error.message);
                }
            };
            testQuery();
        }
    }, [user, firestore, claims]);

    if (!user) return null;

    return (
        <div className="bg-slate-900 text-white p-4 rounded-lg mb-6 font-mono text-xs overflow-auto max-h-40 border-2 border-primary">
            <h3 className="text-primary font-bold mb-2">Auth Debug Information</h3>
            <p>UID: {user.uid}</p>
            <p>Email: {user.email}</p>
            <p>Role: {claims?.role || 'none'}</p>
            <p>Is Admin (Rules): {['itsmeabdulk@gmail.com', 'radstar.in@gmail.com'].includes(user.email || '') ? 'Yes (Email match)' : 'No'}</p>
        </div>
    );
}
