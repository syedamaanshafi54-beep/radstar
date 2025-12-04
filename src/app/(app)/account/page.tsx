'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, updateUserProfile, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, History, LifeBuoy, Repeat, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Order, OrderItem, UserProfile } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { Input } from '@/components/ui/input';

function OrderDetails({ items }: { items: OrderItem[] }) {
  if (!items || items.length === 0) {
    return <div className="p-4 text-muted-foreground">No items found for this order.</div>;
  }

  return (
    <div className="p-4 bg-secondary/50 rounded-md mt-2 space-y-3">
      <h4 className="font-semibold">Order Items</h4>
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <div>
            <p className="font-medium">{item.name} {item.variantName ? `(${item.variantName})` : ''}</p>
            <p className="text-sm text-muted-foreground">Quantity: {item.qty}</p>
          </div>
          <p className="font-medium"><span className="font-currency">₹</span>{formatPrice(item.price * item.qty)}</p>
        </div>
      ))}
    </div>
  );
}


function OrderHistory() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const ordersQuery = useMemoFirebase(
    () => user ? query(collection(firestore, `users/${user.uid}/orders`), orderBy('createdAt', 'desc')) : null,
    [firestore, user]
  );
  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return <p className="text-muted-foreground">You have not placed any orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Collapsible key={order.id} open={openOrderId === order.id} onOpenChange={(isOpen) => setOpenOrderId(isOpen ? order.id : null)}>
            <Card>
                <CardHeader className="p-4">
                    <CollapsibleTrigger asChild>
                      <div className="flex justify-between items-center w-full cursor-pointer">
                          <div className="text-left">
                              <p className="font-semibold">Order #{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                  {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : ''} - <span className="font-currency">₹</span>{formatPrice(order.totalAmount)}
                              </p>
                          </div>
                          <div className="flex items-center gap-2">
                               <span className="text-sm font-medium">{order.status}</span>
                               <div className="p-2 rounded-full hover:bg-accent">
                                  {openOrderId === order.id ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                                  <span className="sr-only">Toggle Details</span>
                               </div>
                          </div>
                      </div>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="p-4 pt-0">
                       <OrderDetails items={order.items} />
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
      ))}
    </div>
  );
}


export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSavingName, setIsSavingName] = useState(false);

  // Fetch the user's Firestore document
  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (userProfile) {
        setDisplayName(userProfile.displayName || '');
    }
  }, [user, userProfile, isUserLoading, router]);

  const handleNameChange = async () => {
    if (!user || !displayName.trim()) {
        toast({ variant: "destructive", title: "Display name cannot be empty." });
        return;
    }
    setIsSavingName(true);
    try {
        await updateUserProfile(user, { displayName });
        toast({ title: "Display name updated successfully!" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to update name.", description: error.message });
    } finally {
        setIsSavingName(false);
    }
  };

  const handleSignOut = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error signing out',
        description: error.message,
      });
    }
  };

  if (isUserLoading || isProfileLoading || !user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 lg:py-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-headline flex items-center gap-2"><Package/> My Account</CardTitle>
            <CardDescription>
              Manage your account settings and view your order history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Display Name</h3>
                    <div className="flex items-center gap-2">
                        <Input 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                        />
                        <Button onClick={handleNameChange} disabled={isSavingName} size="icon">
                           {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                           <span className="sr-only">Save name</span>
                        </Button>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-muted-foreground">{user.email || 'No email provided'}</p>
                </div>
                 <div>
                    <h3 className="font-semibold">User ID</h3>
                    <p className="text-muted-foreground text-sm break-all">{userProfile?.customUserId || 'Not assigned yet'}</p>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History/> Order History</CardTitle>
                <CardDescription>Review your previous orders and their status.</CardDescription>
            </CardHeader>
            <CardContent>
                <OrderHistory />
            </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-secondary/40 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Repeat /> Auto-Pay Subscription</CardTitle>
                    <CardDescription>Set up monthly deliveries of your favorite products.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground font-medium">This feature is coming soon! Auto-pay will allow you to receive your orders automatically without having to place them manually each month.</p>
                </CardContent>
                <CardFooter>
                    <Button disabled>Coming Soon</Button>
                </CardFooter>
            </Card>
             <Card className="bg-secondary/40 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LifeBuoy /> Cancellation & Refunds</CardTitle>
                    <CardDescription>Need help with an order?</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground font-medium">For any issues with your order, including cancellations or refunds, please contact our support team directly. We're here to help!</p>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline"><a href="mailto:radstartrading@gmail.com">Contact Support</a></Button>
                </CardFooter>
            </Card>
        </div>

      </div>
    </div>
  );
}
