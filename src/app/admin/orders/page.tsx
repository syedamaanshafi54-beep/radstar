'use server';

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
import { getAdminApp } from '@/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

type EnrichedOrder = Order & {
    id: string;
    customerName: string;
    customerEmail: string;
};

async function getOrders(): Promise<EnrichedOrder[]> {
    const firestore = getFirestore(getAdminApp());
    const auth = getAuth(getAdminApp());

    const ordersSnapshot = await firestore.collectionGroup('orders').orderBy('createdAt', 'desc').get();
    
    if (ordersSnapshot.empty) {
        return [];
    }

    const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    const userIds = [...new Set(ordersData.map(order => order.userId))];
    const userRecords = await auth.getUsers(userIds.map(uid => ({ uid })));

    const usersMap = new Map<string, UserProfile>();
    userRecords.users.forEach(record => {
        usersMap.set(record.uid, {
            uid: record.uid,
            displayName: record.displayName || 'Unknown',
            email: record.email || 'No email',
            photoURL: record.photoURL,
        } as UserProfile);
    });

    const enrichedOrders: EnrichedOrder[] = ordersData.map(order => {
        const user = usersMap.get(order.userId);
        const name = order.shippingInfo?.name || user?.displayName || 'Unknown User';
        const email = order.shippingInfo?.email || user?.email || 'No email';

        return {
            ...order,
            id: order.id,
            customerName: name,
            customerEmail: email,
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
