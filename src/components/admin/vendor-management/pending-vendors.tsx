'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import type { Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { logDiscountChange } from '@/firebase/vendors';

export function PendingVendors() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [defaultDiscount, setDefaultDiscount] = useState('20');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Replace useCollection with direct state management
    const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setPendingVendors([]);
            setIsLoading(false);
            return;
        }

        const fetchVendors = async () => {
            try {
                setIsLoading(true);
                const q = query(
                    collection(firestore, 'vendors'),
                    where('status', '==', 'pending'),
                    orderBy('appliedAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const vendors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
                setPendingVendors(vendors);
            } catch (error) {
                console.error('Error fetching vendors:', error);
                setPendingVendors([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendors();
    }, [firestore, user]);

    const handleApproveClick = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setDefaultDiscount('20'); // Default 20%
        setShowConfirmDialog(true);
    };

    const handleApprove = async () => {
        if (!selectedVendor || !user) return;

        const discount = parseFloat(defaultDiscount);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            toast({
                title: 'Invalid Discount',
                description: 'Please enter a valid discount between 0 and 100',
                variant: 'destructive',
            });
            return;
        }

        setIsApproving(true);
        try {
            const vendorRef = doc(firestore, 'vendors', selectedVendor.id);
            const userRef = doc(firestore, 'users', selectedVendor.userId);

            // Update vendor document
            await updateDoc(vendorRef, {
                status: 'approved',
                defaultDiscount: discount,
                reviewedAt: serverTimestamp(),
                reviewedBy: user.uid,
                lastModifiedAt: serverTimestamp(),
                lastModifiedBy: user.uid,
            });

            // Update user document
            await updateDoc(userRef, {
                isVendor: true,
                vendorId: selectedVendor.id,
                vendorName: selectedVendor.businessName,
            });

            // Log the change
            await logDiscountChange(
                firestore,
                selectedVendor.id,
                selectedVendor.businessName,
                'default',
                0,
                discount,
                user.uid,
                user.displayName || user.email || 'Admin',
                undefined,
                undefined,
                'Initial approval'
            );

            toast({
                title: 'Vendor Approved',
                description: `${selectedVendor.businessName} has been approved with ${discount}% discount`,
            });

            setShowConfirmDialog(false);
            setSelectedVendor(null);
        } catch (error: any) {
            console.error('Error approving vendor:', error);
            toast({
                title: 'Error',
                description: 'Failed to approve vendor. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async (vendor: Vendor) => {
        if (!user) return;

        setIsRejecting(true);
        try {
            const vendorRef = doc(firestore, 'vendors', vendor.id);
            await updateDoc(vendorRef, {
                status: 'rejected',
                reviewedAt: serverTimestamp(),
                reviewedBy: user.uid,
            });

            toast({
                title: 'Vendor Rejected',
                description: `${vendor.businessName} application has been rejected`,
            });
        } catch (error: any) {
            console.error('Error rejecting vendor:', error);
            toast({
                title: 'Error',
                description: 'Failed to reject vendor. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsRejecting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!pendingVendors || pendingVendors.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                <p>No pending vendor applications</p>
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingVendors.map((vendor) => (
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
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleApproveClick(vendor)}
                                        disabled={isApproving || isRejecting}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleReject(vendor)}
                                        disabled={isApproving || isRejecting}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Approval Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Vendor</DialogTitle>
                        <DialogDescription>
                            Set the default discount for {selectedVendor?.businessName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="discount">Default Discount (%)</Label>
                            <Input
                                id="discount"
                                type="number"
                                min="0"
                                max="100"
                                value={defaultDiscount}
                                onChange={(e) => setDefaultDiscount(e.target.value)}
                                placeholder="20"
                            />
                            <p className="text-sm text-muted-foreground">
                                This discount will apply to all products by default
                            </p>
                        </div>

                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <p className="text-sm font-medium text-yellow-900">
                                ⚠️ Confirmation Required
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                                Vendor will be given <strong>{defaultDiscount}%</strong> discount. Are you sure?
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isApproving}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} disabled={isApproving}>
                            {isApproving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                'Confirm Approval'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
