
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
import { useEffect, useState, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useUser, useFirestore, useDoc, updateUserProfile } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { formatPrice } from "@/lib/utils";
import type { UserProfile, Order, OrderStatus } from "@/lib/types";
import OrderSuccessAnimation from "@/components/OrderSuccessAnimation";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductDetails from "@/components/product-details";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const formSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  phone: z.string().length(10, "Phone number must be exactly 10 digits"),
  paymentMethod: z.enum(["cod", "razorpay"], {
    required_error: "You need to select a payment method.",
  }),
});

type ShippingInfo = z.infer<typeof formSchema>;

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart, isCartLoading } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  // Block admin from placing orders
  const isAdmin = user?.email === 'itsmeabdulk@gmail.com' || user?.email === 'radstar.in@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      toast({
        title: "Access Restricted",
        description: "Admins cannot place orders. Please use a customer account.",
      });
      router.push('/admin');
    }
  }, [isAdmin, router, toast]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced && !isCartLoading) {
      router.push("/products");
    }
  }, [cartItems.length, orderPlaced, router, isCartLoading]);

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

  useEffect(() => {
    if (!user) return;
    if (userProfile) {
      form.setValue("email", userProfile.email || user.email || "");
      const nameParts = userProfile.displayName?.split(" ") || [];
      form.setValue("firstName", nameParts[0] || "");
      form.setValue("lastName", nameParts.slice(1).join(" ") || "");
      form.setValue("phone", userProfile.phone || "");

      if (userProfile.address) {
        const parts = userProfile.address.split(", ");
        if (parts.length >= 4) {
          form.setValue("address", parts[0]);
          form.setValue("city", parts[1]);
          form.setValue("state", parts[2]);
          form.setValue("zip", parts[3]);
        } else {
          form.setValue("address", userProfile.address);
        }
      }
    } else {
      form.setValue("email", user.email || "");
      const nameParts = user.displayName?.split(" ") || [];
      form.setValue("firstName", nameParts[0] || "");
      form.setValue("lastName", nameParts.slice(1).join(" ") || "");
    }
  }, [user, userProfile, form]);

  const constructOrderPayload = (
    shippingInfo: ShippingInfo,
    status: OrderStatus = "pending_payment"
  ) => {
    if (!user) throw new Error("User not authenticated");

    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `RS-${datePart}-${randomPart}`;

    return {
      orderNumber,
      userId: user.uid,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        variantName: item.variant?.name || null,
        qty: item.quantity,
        price:
          item.variant?.salePrice ??
          item.variant?.price ??
          item.product.salePrice ??
          item.product.defaultPrice,
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
      paymentMethod: shippingInfo.paymentMethod,
      paymentStatus: 'created',
      status: status,
      createdAt: new Date(),
    };
  };

  const placeOrderInFirestore = async (
    shippingInfo: ShippingInfo,
    orderId?: string
  ): Promise<string> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to place an order.",
      });
      setIsProcessing(false);
      router.push("/login");
      throw new Error("User not authenticated");
    }

    const fullAddress = `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state}, ${shippingInfo.zip}`;
    await updateUserProfile(user, {
      displayName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
      phone: shippingInfo.phone,
      address: fullAddress,
    });

    const orderPayload = constructOrderPayload(shippingInfo, 'placed');

    try {
      const orderCollectionRef = collection(firestore, "users", user.uid, "orders");
      const orderRef = orderId
        ? doc(orderCollectionRef, orderId)
        : doc(orderCollectionRef);

      await setDoc(orderRef, {
        ...orderPayload,
        createdAt: serverTimestamp(),
      });
      setOrderPlaced({ ...orderPayload, id: orderRef.id } as unknown as Order);
      return orderRef.id;
    } catch (error) {
      console.error("Order placement error:", error);
      toast({
        variant: "destructive",
        title: "Could not place order",
        description: "Please try again or contact support.",
      });
      throw error;
    }
  };

  const handleRazorpayPayment = async (shippingInfo: ShippingInfo) => {
    if (!user) return;

    setIsProcessing(true);

    try {
      const idToken = await user.getIdToken(true);
      const token = await user.getIdToken(true);
      console.log("DEBUG TOKEN:", token ? token.substring(0, 30) + "..." : "EMPTY/NULL");
      if (!token) {
        console.error("Stopping payment: User is logged in but has no ID token");
        toast({ title: "Authentication Error", variant: "destructive", description: "Could not generate authentication token. Please try logging in again." });
        setIsProcessing(false);
        return;
      }


      const orderPayload = constructOrderPayload(shippingInfo, 'pending_payment');

      const createOrderResponse = await fetch(`/api/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          amount: cartTotal,
          receipt: `rcpt_${Date.now()}`,
          orderPayload: orderPayload
        }),
      });

      if (!createOrderResponse.ok) {
        throw new Error("Failed to initialize payment.");
      }

      const razorpayOrder = await createOrderResponse.json();
      const firestoreOrderId = razorpayOrder.firestoreOrderId;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Rad Star Trading",
        description: `Order #${firestoreOrderId}`,
        order_id: razorpayOrder.id,
        handler: async (paymentResponse: any) => {
          setIsProcessing(true);
          try {
            // VERIFY ON SERVER
            const verifyResponse = await fetch(`/api/razorpay/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                firestoreOrderId: firestoreOrderId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              let errorText = "Payment verification failed.";
              try {
                const errorJson = await verifyResponse.json();
                errorText = errorJson.error || errorJson.message || errorText;
              } catch {
                errorText = await verifyResponse.text() || errorText;
              }
              throw new Error(errorText);
            }

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              clearCart();
              setShowSuccess(true);
              setTimeout(() => {
                router.push(`/order-success?orderId=${firestoreOrderId}`);
              }, 3000);
            } else {
              throw new Error(verifyResult.message || "Payment verification failed.");
            }

          } catch (verificationError: any) {
            console.error("Razorpay verification failed:", verificationError);
            toast({
              variant: "destructive",
              title: "Payment Verification Failed",
              description: verificationError.message || "Please contact support.",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          email: shippingInfo.email,
          contact: shippingInfo.phone,
        },
        theme: { color: "#D4AF37" },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast({ variant: "destructive", title: "Payment Cancelled", description: "You closed the payment window." });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (paymentFailedResponse: any) => {
        console.error("Razorpay payment failed:", paymentFailedResponse.error);
        toast({ variant: "destructive", title: "Payment Failed", description: paymentFailedResponse.error.description });
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error: any) {
      console.error("Failed to process Razorpay payment:", error);
      toast({
        variant: "destructive",
        title: "Payment Initialization Failed",
        description: error.message || "Could not connect to the payment gateway.",
      });
      setIsProcessing(false);
    }
  };

  const handleFormSubmit = async (shippingInfo: ShippingInfo) => {
    setIsProcessing(true);
    try {
      if (shippingInfo.paymentMethod === "cod") {
        await placeOrderInFirestore(shippingInfo);
        clearCart();
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/order-success'); // Redirect to success page after animation
        }, 3000);
      } else if (shippingInfo.paymentMethod === "razorpay") {
        await handleRazorpayPayment(shippingInfo);
      }
    } catch (error) {
    } finally {
      if (shippingInfo.paymentMethod === "cod") {
        setIsProcessing(false);
      }
    }
  };

  if ((isCartLoading && !orderPlaced) || (!cartItems.length && !orderPlaced)) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-16 lg:py-24">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      {showSuccess && <OrderSuccessAnimation />}
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
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!!orderPlaced || isProcessing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl><Input {...field} disabled={!!orderPlaced || isProcessing} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl><Input {...field} disabled={!!orderPlaced || isProcessing} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input {...field} disabled={!!orderPlaced || isProcessing} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input {...field} disabled={!!orderPlaced || isProcessing} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl><Input {...field} disabled={!!orderPlaced || isProcessing} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="zip" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl><Input {...field} disabled={!!orderPlaced || isProcessing} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-background">
                          <span className="px-3 text-muted-foreground">+91</span>
                          <Input
                            {...field}
                            type="tel"
                            maxLength={10}
                            disabled={!!orderPlaced || isProcessing}
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            onChange={(e) => {
                              const numeric = e.target.value.replace(/[^0-9]/g, "");
                              field.onChange(numeric.slice(0, 10));
                            }}
                            value={field.value}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription className="font-medium">All transactions are secure and encrypted.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-4"
                          disabled={!!orderPlaced || isProcessing}
                        >
                          <Label className="flex items-center gap-4 border rounded-md p-4 cursor-pointer hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:border-primary">
                            <RadioGroupItem value="cod" id="cod" />
                            <div>
                              <span className="font-semibold">Cash on Delivery</span>
                              <p className="text-sm text-muted-foreground">Pay with cash upon delivery.</p>
                            </div>
                          </Label>
                          <Label className="flex items-center gap-4 border rounded-md p-4 cursor-pointer hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:border-primary">
                            <RadioGroupItem value="razorpay" id="razorpay" />
                            <div className="flex items-center gap-2">
                              <Image src="/razorpay-logo.svg" alt="Razorpay" width={24} height={24} />
                              <div>
                                <span className="font-semibold">Razorpay</span>
                                <p className="text-sm text-muted-foreground">Credit/Debit Card, UPI, &amp; More.</p>
                              </div>
                            </div>
                          </Label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="pt-4" />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-28">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {orderPlaced ? (
                    <div className="flex flex-col items-center justify-center text-center py-4">
                      <h2 className="text-xl font-semibold mt-4 text-green-600">Order Placed!</h2>
                      <p className="text-muted-foreground mb-4">Thank you for your order! Continue shopping to discover more products.</p>
                      <Button asChild><a href="/products">Discover Our Collection</a></Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map(({ product, quantity, variant }) => {
                        const price = variant?.salePrice ?? variant?.price ?? product.salePrice ?? product.defaultPrice;
                        return (
                          <Dialog key={product.id + (variant?.id || '')}>
                            <div className="flex justify-between items-center">
                              <DialogTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                  <Image src={product.image.url} alt={product.name} width={40} height={40} className="rounded-md" />
                                  <div>
                                    <p className="hover:text-primary transition-colors">{product.name} {variant ? `(${variant.name})` : ''}</p>
                                    <p className="text-sm text-muted-foreground">x{quantity}</p>
                                  </div>
                                </div>
                              </DialogTrigger>
                              <span><span className="font-currency">₹</span>{formatPrice(price * quantity)}</span>
                            </div>
                            <DialogContent className="max-w-4xl w-full p-0">
                              <DialogHeader className="sr-only">
                                <DialogTitle>{product.name}</DialogTitle>
                                <DialogDescription>{product.description}</DialogDescription>
                              </DialogHeader>
                              <ProductDetails product={product} />
                            </DialogContent>
                          </Dialog>
                        );
                      })}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span><span className="font-currency">₹</span>{formatPrice(cartTotal)}</span>
                      </div>
                      <Button type="submit" disabled={isProcessing} className="w-full mt-4">
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place Order"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
