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
import type { Order, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, WithId } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

type EnrichedOrder = Order & {
    id: string;
    customerName: string;
    customerEmail: string;
};

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const ordersCollectionGroup = useMemoFirebase(() => collectionGroup(firestore, 'orders'), [firestore]);
    const ordersQuery = useMemoFirebase(() => query(ordersCollectionGroup, orderBy('createdAt', 'desc')), [ordersCollectionGroup]);
    
    const { data: orders, isLoading: isOrdersLoading } = useCollection<WithId<Order>>(ordersQuery);

    const enrichedOrders = useMemo(() => {
        if (!orders) return [];
        return orders.map(order => ({
            ...order,
            id: order.id,
            customerName: order.shippingInfo?.name || 'Unknown User',
            customerEmail: order.shippingInfo?.email || 'No Email',
        }));
    }, [orders]);


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
              {isOrdersLoading ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                </TableRow>
              ) : enrichedOrders.length > 0 ? (
                enrichedOrders.map((order) => (
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
