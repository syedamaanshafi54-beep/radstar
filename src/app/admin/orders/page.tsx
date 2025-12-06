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
import { getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { WithId } from '@/firebase';

// Helper function to safely initialize and get the admin app
function getAdminApp() {
  if (getApps().length) {
    return getApp();
  }
  // This environment variable is automatically set by App Hosting.
  return initializeApp({ projectId: process.env.GCLOUD_PROJECT });
}

type EnrichedOrder = Order & {
    id: string;
    customerName: string;
    customerEmail: string;
};

async function getOrders() {
    const firestore = getFirestore(getAdminApp());
    const ordersSnapshot = await firestore.collectionGroup('orders').orderBy('createdAt', 'desc').get();

    if (ordersSnapshot.empty) {
        return [];
    }
    
    const enrichedOrders: EnrichedOrder[] = ordersSnapshot.docs.map(doc => {
        const orderData = doc.data() as Order;
        return {
            ...orderData,
            id: doc.id,
            // Safely access nested properties
            customerName: orderData.shippingInfo?.name || 'Unknown User',
            customerEmail: orderData.shippingInfo?.email || 'No Email',
            // Convert timestamp to serializable string
            createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
    });

    return enrichedOrders;
}


export default async function AdminOrdersPage() {
    const orders = await getOrders();

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
              {orders.length > 0 ? (
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
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
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
