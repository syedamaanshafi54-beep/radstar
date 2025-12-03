
'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, WithId, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, getDocs, where, collectionGroup } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/utils';

type User = {
    id: string;
    displayName: string;
    email: string;
}

type EnrichedOrder = Order & {
    id: string;
    customerName: string;
    customerEmail: string;
};


export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const [orders, setOrders] = useState<EnrichedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrdersAndUsers = async () => {
            if (!firestore) return;
            setIsLoading(true);

            try {
                // Use a collection group query to get all orders across all users.
                const ordersQuery = query(collectionGroup(firestore, 'orders'));
                const ordersSnapshot = await getDocs(ordersQuery);
                const fetchedOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithId<Order>));

                if (fetchedOrders.length === 0) {
                    setOrders([]);
                    setIsLoading(false);
                    return;
                }

                // Enrich orders with customer data from the shippingInfo field
                const enrichedOrders: EnrichedOrder[] = fetchedOrders.map(order => {
                    const customerName = order.shippingInfo?.name || 'Unknown User';
                    const customerEmail = order.shippingInfo?.email || 'No email';
                    return {
                        ...order,
                        customerName,
                        customerEmail,
                    };
                });

                // Sort orders on the client-side by creation date, descending
                const sortedOrders = enrichedOrders.sort((a, b) => {
                    if (b.createdAt && a.createdAt) {
                        return b.createdAt.seconds - a.createdAt.seconds;
                    }
                    if (b.createdAt) return 1; // b comes first if a.createdAt is missing
                    if (a.createdAt) return -1; // a comes first if b.createdAt is missing
                    return 0;
                });


                setOrders(sortedOrders);
            } catch (error) {
                console.error('Error fetching all orders:', error);

                // Create and emit the contextual error for debugging
                const contextualError = new FirestorePermissionError({
                    operation: 'list',
                    path: 'orders (collection group)',
                });
                errorEmitter.emit('permission-error', contextualError);

            } finally {
                setIsLoading(false);
            }
        };

        fetchOrdersAndUsers();
    }, [firestore]);


  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Orders</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>A list of all orders from your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {isLoading ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{order.customerName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{order.customerName}</div>
                                <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell><span className="font-currency">₹</span>{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))
               ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center p-8">
                      <p className="font-semibold">No orders found.</p>
                      <p className="text-muted-foreground">Once customers start placing orders, they will appear here.</p>
                    </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
