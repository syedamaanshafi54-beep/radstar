
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
import type { Order, OrderStatus } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type EnrichedOrder = Order & {
  id: string;
  customerName: string;
  customerEmail: string;
  userId: string;
};

// Status configuration with labels and badge variants
const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'placed': { label: 'Placed', variant: 'default' },
  'pending_payment': { label: 'Pending Payment', variant: 'outline' },
  'paid': { label: 'Paid', variant: 'default' },
  'confirmed': { label: 'Confirmed', variant: 'default' },
  'packed': { label: 'Packed', variant: 'secondary' },
  'shipped': { label: 'Shipped', variant: 'secondary' },
  'out_for_delivery': { label: 'Out for Delivery', variant: 'secondary' },
  'delivered': { label: 'Delivered', variant: 'default' },
  'cancelled': { label: 'Cancelled', variant: 'destructive' },
};

function StatusSelect({ order }: { order: EnrichedOrder }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order.userId || !order.id) {
      toast({
        title: 'Error',
        description: 'Unable to update order status. Missing order information.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);

      await updateDoc(orderRef, {
        status: newStatus,
        statusUpdatedAt: serverTimestamp(),
        statusHistory: [
          ...(order.statusHistory || []),
          {
            status: newStatus,
            changedAt: serverTimestamp(),
          }
        ]
      });

      toast({
        title: 'Status Updated',
        description: `Order #${order.orderNumber} status changed to ${STATUS_CONFIG[newStatus].label}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={order.status}
      onValueChange={(value) => handleStatusChange(value as OrderStatus)}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          {isUpdating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Updating...
            </span>
          ) : (
            <Badge variant={STATUS_CONFIG[order.status]?.variant || 'default'}>
              {STATUS_CONFIG[order.status]?.label || order.status}
            </Badge>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <SelectItem key={status} value={status}>
            <Badge variant={config.variant}>{config.label}</Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
                    <TableCell className="font-medium">#{order.orderNumber || order.id.substring(0, 6)}</TableCell>
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
                    <TableCell>
                      <StatusSelect order={order} />
                    </TableCell>
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
