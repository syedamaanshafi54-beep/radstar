
"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase, updateUserProfile } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { formatPrice } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";


const formSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  phone: z.string().min(10, "Phone number is required"),
  paymentMethod: z.enum(["cod"], {
    required_error: "You need to select a payment method.",
  }),
});

type ShippingInfo = z.infer<typeof formSchema>;

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);


  useEffect(() => {
    if (cartItems.length === 0 && !isProcessing) {
      router.push("/products");
    }
  }, [cartItems, router, isProcessing]);
  
  const form = useForm<ShippingInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      paymentMethod: "cod",
    },
  });

  // Sync form with user data from Firestore
  useEffect(() => {
    if (userProfile) {
      form.setValue('email', userProfile.email || user?.email || '');
      
      const nameParts = userProfile.displayName?.split(' ') || [];
      form.setValue('firstName', nameParts[0] || '');
      form.setValue('lastName', nameParts.slice(1).join(' ') || '');
      
      form.setValue('phone', userProfile.phone || '');

      // Check if address is a string and try to parse it
      if (userProfile.address) {
          form.setValue('address', userProfile.address);
      }

    } else if (user) {
      // Fallback to basic user object if profile is not loaded yet
      form.setValue('email', user.email || '');
      const nameParts = user.displayName?.split(' ') || [];
      form.setValue('firstName', nameParts[0] || '');
      form.setValue('lastName', nameParts.slice(1).join(' ') || '');
    }
  }, [user, userProfile, form]);


  const placeOrder = async (shippingInfo: ShippingInfo) => {
    setIsProcessing(true);

    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to place an order.",
        });
        setIsProcessing(false);
        router.push('/login');
        return;
    }

    // Save/update user's address info in their profile
    const fullAddress = `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state}, ${shippingInfo.zip}`;
    await updateUserProfile(user, {
      displayName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
      phone: shippingInfo.phone,
      address: fullAddress,
    });


    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `RS-${datePart}-${randomPart}`;
    
    const orderPayload = {
      orderNumber,
      userId: user.uid,
      items: cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        variantName: item.variant?.name || null,
        qty: item.quantity,
        price: item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.defaultPrice,
      })),
      shippingInfo: {
        name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zip: shippingInfo.zip,
      },
      subtotal: cartTotal,
      shipping: 0, 
      totalAmount: cartTotal,
      paymentMethod: 'COD',
      status: 'placed',
      createdAt: serverTimestamp(),
    };

    const ordersCollection = collection(firestore, `users/${user.uid}/orders`);
    addDoc(ordersCollection, orderPayload)
      .then((docRef) => {
          clearCart();
          router.push(`/checkout/success`);
      })
      .catch((error) => {
          console.error("Order placement error:", error);
          const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: `users/${user.uid}/orders`,
            requestResourceData: orderPayload
          });
          errorEmitter.emit('permission-error', contextualError);
          toast({
              variant: "destructive",
              title: "Could not place order",
              description: "Please try again or contact support.",
          });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }

  const handleFormSubmit = (shippingInfo: ShippingInfo) => {
    placeOrder(shippingInfo);
  }

  if (cartItems.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 lg:py-24">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-headline font-bold">Checkout</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid lg:grid-cols-2 gap-8 md:gap-12">
          <div>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="zip" render={({ field }) => (<FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+91" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription className="font-medium">All transactions are secure and encrypted.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1"
                        >
                          <Label className="flex items-center gap-4 border rounded-md p-4 cursor-pointer hover:bg-accent has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary">
                            <RadioGroupItem value="cod" id="cod" />
                             <div>
                                <span className="font-semibold">Cash on Delivery</span>
                                <p className="text-sm text-muted-foreground">Pay upon arrival (default for now)</p>
                            </div>
                          </Label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="pt-4" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
              <Card className="sticky top-28">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                    {cartItems.map(({ product, quantity, variant }) => {
                       const price = variant?.price ?? product.defaultPrice;
                       const salePrice = variant?.salePrice ?? product.salePrice;
                       const displayPrice = salePrice ?? price;

                      return (
                      <div key={getCartItemId(product.id, variant?.id)} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                            <Image
                              src={product.image.url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{quantity}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            {variant && <p className="text-sm text-muted-foreground">{variant.name}</p>}
                            <p className="font-semibold text-muted-foreground"><span className="font-currency">₹</span>{formatPrice(displayPrice)} &times; {quantity}</p>
                          </div>
                        </div>
                        <p className="font-semibold"><span className="font-currency">₹</span>{formatPrice(displayPrice * quantity)}</p>
                      </div>
                    )})}
                    <Separator />
                     <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span><span className="font-currency">₹</span>{formatPrice(cartTotal)}</span>
                      </div>
                       <div className="flex justify-between text-muted-foreground">
                          <span>Shipping</span>
                          <span>Free</span>
                      </div>
                      <Separator />
                       <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span><span className="font-currency">₹</span>{formatPrice(cartTotal)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardContent>
                     <Button type="submit" size="lg" className="w-full mt-4 text-lg" disabled={isProcessing}>
                      {isProcessing ? 'Processing...' : 'Place Order'}
                    </Button>
                  </CardContent>
              </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}

function getCartItemId(productId: string, variantId?: string) {
    return variantId ? `${productId}-${variantId}` : productId;
}
