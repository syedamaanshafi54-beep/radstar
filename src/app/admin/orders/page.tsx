
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
import type { Order } from '@/lib/types';
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
    
    const ordersCollectionGroup = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: ordersData, isLoading, error } = useCollection<Order>(ordersCollectionGroup);

    const orders = useMemo<EnrichedOrder[]>(() => {
        if (!ordersData) return [];
        return ordersData.map(order => ({
            ...order,
            id: order.id,
            customerName: order.shippingInfo?.name || 'Unknown User',
            customerEmail: order.shippingInfo?.email || 'No email',
        }));
    }, [ordersData]);

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
                    <TableCell colSpan={5} className="h-48 text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
               ) : error ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-destructive">
                        <h3 className="font-bold text-lg">Error Fetching Orders</h3>
                        <p className="text-sm max-w-md mx-auto">There was a problem loading orders. This is likely a permissions issue.</p>
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
