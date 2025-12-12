'use client';

import { ProductForm } from '@/components/admin/product-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { notFound, useParams } from 'next/navigation';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  
  const productId = Array.isArray(id) ? id[0] : id;

  const productRef = useMemoFirebase(
    () => doc(firestore, 'products', productId),
    [firestore, productId]
  );
  const { data: product, isLoading } = useDoc<Product>(productRef);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Edit Product</h2>
      <ProductForm product={product} />
    </div>
  );
}
