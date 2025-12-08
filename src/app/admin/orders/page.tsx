
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
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';

type EnrichedOrder = Order & {
    id: string;
    customerName: string;
    customerEmail: string;
};

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const ordersQuery = useMemoFirebase(
      () => query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc')),
      [firestore]
    );
    const { data, isLoading, error } = useCollection<Order>(ordersQuery);

    const orders: EnrichedOrder[] = (data || []).map(order => ({
      ...order,
      customerName: order.shippingInfo?.name || 'Unknown User',
      customerEmail: order.shippingInfo?.email || 'No Email',
    }));

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
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
              ) : error ? (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center text-destructive p-8">
                      <p className="font-semibold">Error loading orders:</p>
                      <p>{error.message}</p>
                    </TableCell>
                  </TableRow>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.orderNumber || order.id.substring(0,6)}</TableCell>
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
                    <TableCell>{order.createdAt && typeof order.createdAt !== 'string' ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell><span className="font-currency">₹</span>{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell><Badge>{order.status}</Badge></TableCell>
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
