
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

type Order = {
  orderNumber: string;
}

function SuccessMessage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const firestore = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !orderId) return null;
    return doc(firestore, 'orders', orderId);
  }, [firestore, orderId]);

  const { data: order, isLoading } = useDoc<Order>(orderRef);
  
  if (isLoading) {
    return <Loader2 className="h-20 w-20 text-primary mx-auto mb-6 animate-spin" />;
  }

  return (
    <>
      <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
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
