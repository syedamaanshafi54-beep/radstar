
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
import { useEffect, useState, useMemo } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, History, LifeBuoy, Repeat, ChevronDown, ChevronUp, Save, Home, User, Phone, Mail, Edit, X, RefreshCw, Star, ShoppingCart } from 'lucide-react';
import { collection, query, orderBy, doc, where, limit } from 'firebase/firestore';
import type { Order, OrderItem, UserProfile, Product } from '@/lib/types';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProductReviews from '@/components/product-reviews'; // Verify this path

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

function ProductRecommendations({ orders, allProducts }: { orders: Order[], allProducts: Product[] }) {
  const recommendations = useMemo(() => {
    if (!orders || orders.length === 0 || !allProducts || allProducts.length === 0) {
      return allProducts.slice(0, 5);
    }

    const purchasedCategories = new Set<string>();
    orders.forEach(order => {
      order.items?.forEach(item => {
        const product = allProducts.find(p => p.id === item.productId);
        if (product) purchasedCategories.add(product.category);
      });
    });

    let recs = allProducts.filter(p => purchasedCategories.has(p.category));

    if (recs.length < 3) {
      const others = allProducts.filter(p => !purchasedCategories.has(p.category));
      recs = [...recs, ...others];
    }

    return recs.slice(0, 8);
  }, [orders, allProducts]);

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-headline font-semibold">You May Also Like</h3>
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {recommendations.map((product) => (
            <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
              {/* Note: Linking to existing product dialog might be better if no dedicated page, but for now assuming listing page handles it or we link to listing? 
                  The user asked for suggestions. I'll link to product listing for now if individual page doesn't exist, 
                  BUT I previously created product/[slug]/page.tsx. Oh wait, I deleted it.
                  I should link to /products?product_id=... OR just /products. 
                  Actually, linking to the main products page where user can find it is safest if I deleted the detail page.
                  But detailed view is better. 
                  Given constraints, I'll link to /products.
              */}
              <Link href={`/products?highlight=${product.id}`} className="block h-full">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg bg-secondary/20">
                    <Image
                      src={product.image.url as string}
                      alt={product.image.hint}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium line-clamp-1 text-sm mb-1">{product.name}</h4>
                    <p className="font-bold text-sm"><span className="font-currency">₹</span>{formatPrice(product.salePrice || product.defaultPrice)}</p>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
}


function OrderHistory({ allProducts }: { allProducts: Product[] }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { addToCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const ordersQuery = useMemoFirebase(
    () => user ? query(collection(doc(firestore, 'users', user.uid), 'orders'), orderBy('createdAt', 'desc')) : null,
    [firestore, user]
  );
  const { data: orders, isLoading } = useCollection<Order>(ordersQuery, { listen: true });

  const handleReorder = (order: Order) => {
    let addedCount = 0;
    order.items.forEach(item => {
      const product = allProducts.find(p => p.id === item.productId);
      if (product) {
        const variant = product.variants?.find(v => v.name === item.variantName);
        addToCart(product, item.qty, variant);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast({
        title: "Items Added to Cart",
        description: `${addedCount} items from your previous order have been added.`,
      });
      router.push('/cart');
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Reorder",
        description: "Products from this order are no longer available.",
      });
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending_payment':
      case 'placed': return 'outline';
      case 'packed':
      case 'shipped':
      case 'out_for_delivery': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'delivered': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'placed': 'Order Placed',
      'pending_payment': 'Payment Pending',
      'paid': 'Paid',
      'confirmed': 'Order Confirmed',
      'packed': 'Packed',
      'shipped': 'Shipped',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-secondary/20 rounded-lg">
        <ShoppingBagIcon className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-lg font-medium">No orders yet</p>
        <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here.</p>
        <Button asChild>
          <Link href="/products">Shop Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProductRecommendations orders={orders} allProducts={allProducts} />

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <History className="h-5 w-5" />
          <h3 className="text-xl font-headline font-semibold">Your Orders</h3>
        </div>
        {orders.map((order) => {
          const orderImages = order.items.map(item => {
            const p = allProducts.find(product => product.id === item.productId);
            return p?.image?.url;
          }).filter(Boolean).slice(0, 5);

          const firstProductId = order.items[0]?.productId;
          const firstProduct = allProducts.find(p => p.id === firstProductId);

          return (
            <Card key={order.id} className="overflow-hidden border-muted/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="p-4 bg-secondary/5 border-b pb-3">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize rounded-full px-3 py-0.5">
                        {getStatusLabel(order.status)}
                      </Badge>
                      {order.status === 'delivered' && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed on {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg"><span className="font-currency">₹</span>{formatPrice(order.totalAmount)}</p>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground ml-auto" onClick={() => setOpenOrderId(openOrderId === order.id ? null : order.id)}>
                      {openOrderId === order.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none mb-4">
                  {orderImages.map((img, i) => (
                    <div key={i} className="relative h-14 w-14 min-w-[3.5rem] rounded-md border bg-background overflow-hidden flex-shrink-0">
                      <Image src={img as string} alt="Product" fill className="object-cover" />
                    </div>
                  ))}
                  {order.items.length > 5 && (
                    <div className="h-14 w-14 min-w-[3.5rem] rounded-md border bg-secondary/50 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      +{order.items.length - 5}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t mt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 border-dashed">
                        <Star className="mr-2 h-4 w-4" /> Rate Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Reviews for {firstProduct?.name || 'Product'}</DialogTitle>
                        <DialogDescription>
                          Rate this product/order or view existing reviews.
                        </DialogDescription>
                      </DialogHeader>
                      <ProductReviews productId={firstProductId} defaultOpen={true} />
                    </DialogContent>
                  </Dialog>

                  <Button className="flex-1" onClick={() => handleReorder(order)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Order Again
                  </Button>
                </div>

                <Collapsible open={openOrderId === order.id} onOpenChange={(isOpen) => setOpenOrderId(isOpen ? order.id : null)}>
                  <CollapsibleContent className="pt-4 mt-2 border-t border-dashed">
                    <OrderDetails items={order.items} />
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}

function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: allProducts, isLoading: isProductsLoading } = useCollection<Product>(productsCollection, { listen: false });

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address || '');
    }
  }, [user, userProfile, isUserLoading, router]);

  const handleProfileUpdate = async () => {
    if (!user || !displayName.trim()) {
      toast({ variant: "destructive", title: "Display name cannot be empty." });
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile(user, { displayName, phone, address });
      toast({ title: "Profile updated successfully!" });
      setIsEditing(false); // Exit edit mode on success
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to update profile.", description: error.message });
    } finally {
      setIsSaving(false);
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

  if (isUserLoading || isProfileLoading || !user || isProductsLoading) {
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
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-headline flex items-center gap-2"><Package /> My Account</CardTitle>
              <CardDescription>
                Manage your account settings, profile information, and view your order history.
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-5 w-5" />
                <span className="sr-only">Edit Profile</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={handleProfileUpdate} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save</span>
                </Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><User size={16} /> Personal Information</h3>
                  <div className="space-y-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      disabled={!isEditing}
                    />
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input value={user.email || ''} disabled className="pl-9 bg-secondary/50" />
                    </div>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        className="pl-9"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Home size={16} /> Shipping Address</h3>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full shipping address."
                    rows={5}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order History Section with Recommendations */}
        <OrderHistory allProducts={allProducts || []} />

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
