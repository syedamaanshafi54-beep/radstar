'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, updateDoc, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import type { Vendor, Product, VendorDiscountHistory, BulkDiscountTier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2,
    ArrowLeft,
    Save,
    Percent,
    Package,
    TrendingUp,
    History,
    Trash2,
    Plus,
} from 'lucide-react';
import Link from 'next/link';
import { logDiscountChange, getVendorDiscountHistory } from '@/firebase/vendors';

export default function VendorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const vendorId = params.id as string;

    const [isSaving, setIsSaving] = useState(false);
    const [defaultDiscount, setDefaultDiscount] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'default' | 'product' | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productDiscount, setProductDiscount] = useState('');
    const [bulkTiers, setBulkTiers] = useState<BulkDiscountTier[]>([]);
    const [newTierQty, setNewTierQty] = useState('');
    const [newTierDiscount, setNewTierDiscount] = useState('');

    const vendorRef = useMemo(() => doc(firestore, 'vendors', vendorId), [firestore, vendorId]);

    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [vendorLoading, setVendorLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [discountHistory, setDiscountHistory] = useState<VendorDiscountHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Load vendor and products
    useEffect(() => {
        if (!user) return;

        async function initData() {
            try {
                // Fetch vendor
                setVendorLoading(true);
                const vDoc = await getDoc(doc(firestore, 'vendors', vendorId));
                if (vDoc.exists()) {
                    const vData = { id: vDoc.id, ...vDoc.data() } as Vendor;
                    setVendor(vData);
                    setDefaultDiscount(vData.defaultDiscount?.toString() || '0');
                    setBulkTiers(vData.bulkDiscountTiers || []);
                }

                // Fetch products
                setProductsLoading(true);
                const pSnap = await getDocs(collection(firestore, 'products'));
                setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

                // Fetch history
                setHistoryLoading(true);
                const history = await getVendorDiscountHistory(firestore, vendorId);
                setDiscountHistory(history);
            } catch (error) {
                console.error('Error loading vendor details:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load vendor details',
                    variant: 'destructive',
                });
            } finally {
                setVendorLoading(false);
                setProductsLoading(false);
                setHistoryLoading(false);
            }
        }

        initData();
    }, [firestore, user, vendorId, toast]);

    const handleUpdateDefaultDiscount = () => {
        setConfirmAction('default');
        setShowConfirmDialog(true);
    };

    const handleConfirmDefaultDiscount = async () => {
        if (!vendor || !user) return;

        const discount = parseFloat(defaultDiscount);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            toast({
                title: 'Invalid Discount',
                description: 'Please enter a valid discount between 0 and 100',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(vendorRef, {
                defaultDiscount: discount,
                lastModifiedAt: serverTimestamp(),
                lastModifiedBy: user.uid,
            });

            await logDiscountChange(
                firestore,
                vendor.id,
                vendor.businessName,
                'default',
                vendor.defaultDiscount,
                discount,
                user.uid,
                user.displayName || user.email || 'Admin'
            );

            toast({
                title: 'Discount Updated',
                description: `Default discount set to ${discount}%`,
            });

            setShowConfirmDialog(false);
        } catch (error: any) {
            console.error('Error updating discount:', error);
            toast({
                title: 'Error',
                description: 'Failed to update discount',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateProductDiscount = (product: Product) => {
        setSelectedProduct(product);
        const currentDiscount = vendor?.productDiscounts?.[product.id] || vendor?.defaultDiscount || 0;
        setProductDiscount(currentDiscount.toString());
        setConfirmAction('product');
        setShowConfirmDialog(true);
    };

    const handleConfirmProductDiscount = async () => {
        if (!vendor || !user || !selectedProduct) return;

        const discount = parseFloat(productDiscount);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            toast({
                title: 'Invalid Discount',
                description: 'Please enter a valid discount between 0 and 100',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        try {
            const updatedProductDiscounts = {
                ...(vendor.productDiscounts || {}),
                [selectedProduct.id]: discount,
            };

            await updateDoc(vendorRef, {
                productDiscounts: updatedProductDiscounts,
                lastModifiedAt: serverTimestamp(),
                lastModifiedBy: user.uid,
            });

            await logDiscountChange(
                firestore,
                vendor.id,
                vendor.businessName,
                'product',
                vendor.productDiscounts?.[selectedProduct.id] || vendor.defaultDiscount,
                discount,
                user.uid,
                user.displayName || user.email || 'Admin',
                selectedProduct.id,
                selectedProduct.name
            );

            toast({
                title: 'Product Discount Updated',
                description: `${selectedProduct.name} discount set to ${discount}%`,
            });

            setShowConfirmDialog(false);
            setSelectedProduct(null);
        } catch (error: any) {
            console.error('Error updating product discount:', error);
            toast({
                title: 'Error',
                description: 'Failed to update product discount',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddBulkTier = async () => {
        if (!vendor || !user) return;

        const qty = parseInt(newTierQty);
        const discount = parseFloat(newTierDiscount);

        if (isNaN(qty) || qty <= 0) {
            toast({ title: 'Invalid quantity', variant: 'destructive' });
            return;
        }

        if (isNaN(discount) || discount < 0 || discount > 100) {
            toast({ title: 'Invalid discount', variant: 'destructive' });
            return;
        }

        const newTier: BulkDiscountTier = { minQuantity: qty, discount };
        const updatedTiers = [...bulkTiers, newTier].sort((a, b) => a.minQuantity - b.minQuantity);

        try {
            await updateDoc(vendorRef, {
                bulkDiscountTiers: updatedTiers,
                lastModifiedAt: serverTimestamp(),
                lastModifiedBy: user.uid,
            });

            setBulkTiers(updatedTiers);
            setNewTierQty('');
            setNewTierDiscount('');

            toast({ title: 'Bulk tier added' });
        } catch (error) {
            toast({ title: 'Error adding tier', variant: 'destructive' });
        }
    };

    const handleRemoveBulkTier = async (index: number) => {
        if (!vendor || !user) return;

        const updatedTiers = bulkTiers.filter((_, i) => i !== index);

        try {
            await updateDoc(vendorRef, {
                bulkDiscountTiers: updatedTiers,
                lastModifiedAt: serverTimestamp(),
                lastModifiedBy: user.uid,
            });

            setBulkTiers(updatedTiers);
            toast({ title: 'Bulk tier removed' });
        } catch (error) {
            toast({ title: 'Error removing tier', variant: 'destructive' });
        }
    };

    if (vendorLoading || productsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="text-center p-8">
                <p className="text-muted-foreground">Vendor not found</p>
                <Link href="/admin/vendors">
                    <Button className="mt-4">Back to Vendors</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/vendors">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{vendor.businessName}</h1>
                        <p className="text-muted-foreground">{vendor.businessType}</p>
                    </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                    <Percent className="h-4 w-4 mr-2" />
                    {vendor.defaultDiscount}% Default
                </Badge>
            </div>

            <Tabs defaultValue="default" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="default">Default Discount</TabsTrigger>
                    <TabsTrigger value="products">Product Discounts</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Tiers</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Default Discount Tab */}
                <TabsContent value="default">
                    <Card>
                        <CardHeader>
                            <CardTitle>Default Discount</CardTitle>
                            <CardDescription>
                                This discount applies to all products unless overridden
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="defaultDiscount">Discount Percentage</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="defaultDiscount"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={defaultDiscount}
                                        onChange={(e) => setDefaultDiscount(e.target.value)}
                                    />
                                    <Button onClick={handleUpdateDefaultDiscount} disabled={isSaving}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Product Discounts Tab */}
                <TabsContent value="products">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product-Specific Discounts</CardTitle>
                            <CardDescription>
                                Override default discount for specific products
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Sale Price</TableHead>
                                        <TableHead>Current Discount</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products?.map((product) => {
                                        const currentDiscount =
                                            vendor.productDiscounts?.[product.id] || vendor.defaultDiscount;
                                        const isCustom = vendor.productDiscounts?.[product.id] !== undefined;

                                        return (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        {product.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell><span className="font-currency">₹</span>{product.salePrice || product.defaultPrice}</TableCell>
                                                <TableCell>
                                                    <Badge variant={isCustom ? 'default' : 'outline'}>
                                                        {currentDiscount}% {isCustom && '⭐'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUpdateProductDiscount(product)}
                                                    >
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Bulk Tiers Tab */}
                <TabsContent value="bulk">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bulk Discount Tiers</CardTitle>
                            <CardDescription>
                                Set quantity-based discounts for bulk orders
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Existing Tiers */}
                            {bulkTiers.length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Min Quantity</TableHead>
                                            <TableHead>Discount</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bulkTiers.map((tier, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{tier.minQuantity}+</TableCell>
                                                <TableCell>
                                                    <Badge>{tier.discount}%</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleRemoveBulkTier(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {/* Add New Tier */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-4">Add New Tier</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Min Quantity</Label>
                                        <Input
                                            type="number"
                                            value={newTierQty}
                                            onChange={(e) => setNewTierQty(e.target.value)}
                                            placeholder="50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discount %</Label>
                                        <Input
                                            type="number"
                                            value={newTierDiscount}
                                            onChange={(e) => setNewTierDiscount(e.target.value)}
                                            placeholder="15"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>&nbsp;</Label>
                                        <Button onClick={handleAddBulkTier} className="w-full">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Tier
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Discount Change History</CardTitle>
                            <CardDescription>
                                Audit trail of all discount modifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : discountHistory.length === 0 ? (
                                <p className="text-center text-muted-foreground p-8">No history yet</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Change</TableHead>
                                            <TableHead>Changed By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {discountHistory.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="text-sm">
                                                    {new Date(entry.changedAt.seconds * 1000).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{entry.changeType}</Badge>
                                                </TableCell>
                                                <TableCell>{entry.productName || 'All Products'}</TableCell>
                                                <TableCell>
                                                    <span className="text-muted-foreground">{entry.previousValue}%</span>
                                                    {' → '}
                                                    <span className="font-medium">{entry.newValue}%</span>
                                                </TableCell>
                                                <TableCell className="text-sm">{entry.changedByName}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Discount Change</DialogTitle>
                        <DialogDescription>
                            {confirmAction === 'default'
                                ? `Set default discount to ${defaultDiscount}%`
                                : `Set ${selectedProduct?.name} discount to ${productDiscount}%`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-sm font-medium text-yellow-900">⚠️ Confirmation Required</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            Vendor will be given{' '}
                            <strong>
                                {confirmAction === 'default' ? defaultDiscount : productDiscount}%
                            </strong>{' '}
                            discount. Are you sure?
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={
                                confirmAction === 'default'
                                    ? handleConfirmDefaultDiscount
                                    : handleConfirmProductDiscount
                            }
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Confirm'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
