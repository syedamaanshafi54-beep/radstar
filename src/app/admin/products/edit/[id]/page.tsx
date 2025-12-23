'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { useFirestore, WithId } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const router = useRouter();

  const [product, setProduct] = useState<WithId<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!productId) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }

    if (!firestore) {
        setError('Firestore not available');
        setLoading(false);
        return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const productRef = doc(firestore, 'products', productId);
        const snapshot = await getDoc(productRef);

        if (!snapshot.exists()) {
          setError('Product not found');
          setProduct(null);
        } else {
          setProduct({ id: snapshot.id, ...snapshot.data() } as WithId<Product>);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [firestore, productId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Product data could not be loaded.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Edit Product</h2>
      <ProductForm product={product} />
    </div>
  );
}
