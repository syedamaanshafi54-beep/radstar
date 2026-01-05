'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Vendor } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, Building2, MapPin, Phone, Mail } from 'lucide-react';
export function RejectedVendors() {
    const firestore = useFirestore();
    const { user } = useUser();

    const [rejectedVendors, setRejectedVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setRejectedVendors([]);
            setIsLoading(false);
            return;
        }

        const fetchVendors = async () => {
            try {
                setIsLoading(true);
                const q = query(
                    collection(firestore, 'vendors'),
                    where('status', '==', 'rejected'),
                    orderBy('reviewedAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const vendors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
                setRejectedVendors(vendors);
            } catch (error: any) {
                console.error('Error fetching rejected vendors:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendors();
    }, [firestore, user]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!rejectedVendors || rejectedVendors.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                <p>No rejected vendor applications</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Rejected</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rejectedVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {vendor.businessName}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{vendor.businessType}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {vendor.phone}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {vendor.email}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {vendor.location.type === 'manual'
                                    ? vendor.location.address?.substring(0, 30) + '...'
                                    : `${vendor.location.coordinates?.lat.toFixed(4)}, ${vendor.location.coordinates?.lng.toFixed(4)}`}
                            </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {vendor.appliedAt
                                ? new Date(vendor.appliedAt.seconds * 1000).toLocaleDateString()
                                : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {vendor.reviewedAt
                                ? new Date(vendor.reviewedAt.seconds * 1000).toLocaleDateString()
                                : 'N/A'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
