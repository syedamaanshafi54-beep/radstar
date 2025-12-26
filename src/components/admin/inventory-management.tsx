'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { WithId } from '@/firebase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type InventoryManagementProps = {
    products: WithId<Product>[];
};

export function InventoryManagement({ products }: InventoryManagementProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    const handleStockChange = (productId: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setStockUpdates(prev => ({ ...prev, [productId]: numValue }));
    };

    const handleUpdateStock = async (product: WithId<Product>) => {
        const newStock = stockUpdates[product.id];
        if (newStock === undefined || newStock === product.stock) return;

        setUpdating(prev => ({ ...prev, [product.id]: true }));

        try {
            const productRef = doc(firestore, 'products', product.id);
            await updateDoc(productRef, { stock: newStock });

            toast({
                title: "Stock Updated",
                description: `${product.name} stock updated to ${newStock}`,
            });

            // Clear the update for this product
            setStockUpdates(prev => {
                const newUpdates = { ...prev };
                delete newUpdates[product.id];
                return newUpdates;
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update stock. Please try again.",
            });
        } finally {
            setUpdating(prev => ({ ...prev, [product.id]: false }));
        }
    };

    const getStockStatus = (stock: number | undefined) => {
        if (stock === undefined || stock === null) return { label: 'Not Set', variant: 'secondary' as const, color: 'text-muted-foreground' };
        if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const, color: 'text-destructive' };
        if (stock < 10) return { label: 'Low Stock', variant: 'default' as const, color: 'text-yellow-600' };
        return { label: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
    };

    const totalProducts = products.length;
    const lowStockCount = products.filter(p => (p.stock || 0) < 10 && (p.stock || 0) > 0).length;
    const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
    const totalInventoryValue = products.reduce((sum, p) => sum + ((p.stock || 0) * p.defaultPrice), 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <CardTitle>Inventory Management</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="gap-1">
                            <Package className="h-3 w-3" />
                            {totalProducts} Products
                        </Badge>
                        {lowStockCount > 0 && (
                            <Badge variant="default" className="gap-1 bg-yellow-600">
                                <AlertTriangle className="h-3 w-3" />
                                {lowStockCount} Low
                            </Badge>
                        )}
                        {outOfStockCount > 0 && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {outOfStockCount} Out
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                        <p className="text-2xl font-bold"><span className="font-currency">₹</span>{totalInventoryValue.toLocaleString()}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Low Stock Items</p>
                        <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Out of Stock</p>
                        <p className="text-2xl font-bold text-destructive">{outOfStockCount}</p>
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-center">Current Stock</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Update Stock</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => {
                                const status = getStockStatus(product.stock);
                                const currentStock = product.stock ?? 0;
                                const pendingUpdate = stockUpdates[product.id];
                                const hasUpdate = pendingUpdate !== undefined && pendingUpdate !== currentStock;

                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{product.category}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`font-bold ${status.color}`}>{currentStock}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={status.variant} className="text-xs">
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={pendingUpdate !== undefined ? pendingUpdate : currentStock}
                                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                className="w-20 mx-auto text-center"
                                                disabled={updating[product.id]}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateStock(product)}
                                                disabled={!hasUpdate || updating[product.id]}
                                                className="gap-1"
                                            >
                                                {updating[product.id] ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Save className="h-3 w-3" />
                                                )}
                                                Save
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
