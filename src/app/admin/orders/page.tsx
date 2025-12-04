
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
import { getAdminApp } from '@/firebase/admin';
import { AlertTriangle } from 'lucide-react';

type EnrichedOrder = Order & {
    id: string;
    customerName: string;
    customerEmail: string;
};

async function getOrders(): Promise<EnrichedOrder[]> {
    const firestore = getAdminApp().firestore();

    const ordersSnapshot = await firestore.collectionGroup('orders').get();
    
    const ordersData: EnrichedOrder[] = ordersSnapshot.docs.map(doc => {
        const order = doc.data() as Order;
        return {
            ...order,
            id: doc.id,
            customerName: order.shippingInfo.name || 'Unknown User',
            customerEmail: order.shippingInfo.email || 'No email',
        };
    });

    // Sort orders on the server-side by creation date, descending
    const sortedOrders = ordersData.sort((a, b) => {
        if (b.createdAt && a.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
        }
        if (b.createdAt) return 1; // b comes first if a.createdAt is missing
        if (a.createdAt) return -1; // a comes first if b.createdAt is missing
        return 0;
    });

    return sortedOrders;
}


export default async function AdminOrdersPage() {
    let orders: EnrichedOrder[] = [];
    let error: Error | null = null;
    
    try {
        orders = await getOrders();
    } catch (e: any) {
        error = e;
        console.error("Error fetching orders with Admin SDK:", e);
    }

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
               {error ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-destructive bg-destructive/10">
                        <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-10 w-10"/>
                        <h3 className="font-bold text-lg">Error Fetching Orders</h3>
                        <p className="text-sm max-w-md">
                            {error.message}
                        </p>
                        </div>
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
