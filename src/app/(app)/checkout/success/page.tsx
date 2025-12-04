
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { AnimatedCheck } from "@/components/ui/animated-check";

type Order = {
  orderNumber: string;
}

function SuccessMessage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const firestore = useFirestore();
  const { user } = useUser();

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !orderId || !user) return null;
    // Correctly reference the order within the user's subcollection
    return doc(firestore, `users/${user.uid}/orders`, orderId);
  }, [firestore, orderId, user]);

  const { data: order, isLoading } = useDoc<Order>(orderRef);
  
  if (isLoading || !user) {
    return <Loader2 className="h-20 w-20 text-primary mx-auto mb-6 animate-spin" />;
  }

  return (
    <>
      <AnimatedCheck />
      <h1 className="text-4xl md:text-5xl font-headline font-bold">
        Thank you for your order!
      </h1>
      <p className="mt-4 text-lg font-medium text-muted-foreground">
        Your order has been placed successfully. A confirmation email will be sent to you shortly.
      </p>
      {order && (
        <p className="mt-4 text-base font-semibold text-foreground">
          Order Number: <span className="font-bold text-primary">{order.orderNumber}</span>
        </p>
      )}
      <div className="mt-8 flex gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
         <Button asChild size="lg" variant="outline">
          <Link href="/account">View Orders</Link>
        </Button>
      </div>
    </>
  );
}


export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16 lg:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <Suspense fallback={<Loader2 className="h-20 w-20 text-primary mx-auto mb-6 animate-spin" />}>
          <SuccessMessage />
        </Suspense>
      </div>
    </div>
  );
}
