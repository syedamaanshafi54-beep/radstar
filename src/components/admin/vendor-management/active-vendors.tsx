'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Trash2, Building2, Percent } from 'lucide-react';
import Link from 'next/link';

export function ActiveVendors() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [activeVendors, setActiveVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setActiveVendors([]);
            setIsLoading(false);
            return;
        }

        const fetchVendors = async () => {
            try {
                setIsLoading(true);
                const q = query(
                    collection(firestore, 'vendors'),
                    where('status', '==', 'approved'),
                    orderBy('reviewedAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const vendors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
                setActiveVendors(vendors);
            } catch (error: any) {
                console.error('Error fetching active vendors:', error);
                // Only toast if it's a real error, not just an index error we're expecting
                if (!error.message?.includes('index')) {
                    toast({
                        title: 'Error',
                        description: 'Failed to load active vendors.',
                        variant: 'destructive',
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendors();
    }, [firestore, user, toast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!activeVendors || activeVendors.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                <p>No active vendors</p>
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
                    <TableHead>Default Discount</TableHead>
                    <TableHead>Product Discounts</TableHead>
                    <TableHead>Bulk Tiers</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {activeVendors.map((vendor) => {
                    const productDiscountCount = vendor.productDiscounts
                        ? Object.keys(vendor.productDiscounts).length
                        : 0;
                    const bulkTierCount = vendor.bulkDiscountTiers?.length || 0;

                    return (
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
                            <TableCell className="text-sm">
                                <div>{vendor.phone}</div>
                                <div className="text-muted-foreground">{vendor.email}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                    <Percent className="h-3 w-3" />
                                    {vendor.defaultDiscount}%
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {productDiscountCount > 0 ? (
                                    <Badge variant="outline">{productDiscountCount} products</Badge>
                                ) : (
                                    <span className="text-sm text-muted-foreground">None</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {bulkTierCount > 0 ? (
                                    <Badge variant="outline">{bulkTierCount} tiers</Badge>
                                ) : (
                                    <span className="text-sm text-muted-foreground">None</span>
                                )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {vendor.reviewedAt
                                    ? new Date(vendor.reviewedAt.seconds * 1000).toLocaleDateString()
                                    : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Link href={`/admin/vendors/${vendor.id}`}>
                                        <Button size="sm" variant="outline">
                                            <Edit className="h-4 w-4 mr-1" />
                                            Manage
                                        </Button>
                                    </Link>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
