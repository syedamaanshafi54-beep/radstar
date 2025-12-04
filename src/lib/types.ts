
import { type StaticImageData } from "next/image";
import { type Timestamp } from "firebase/firestore";

export type ProductImage = {
  id: string;
  url: string | StaticImageData;
  hint: string;
};

export type ProductVariant = {
  id: string;
  name: string; // e.g., "500g", "1kg"
  price: number;
  salePrice?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  benefits: string[];
  defaultPrice: number;
  salePrice?: number;
  variants?: ProductVariant[];
  image: ProductImage;
  alternateImage?: ProductImage;
  category: string;
  ingredients?: string[];
  nutritionFacts?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  variant?: ProductVariant; // A cart item can be a specific variant
};

export type OrderItem = {
  productId: string;
  name: string;
  variantName: string | null;
  qty: number;
  price: number;
}

export type ShippingInfo = {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
};

export type Order = {
    id: string;
    orderNumber: string;
    userId: string;
    items: OrderItem[];
    shippingInfo: ShippingInfo;
    subtotal: number;
    shipping: number;
    totalAmount: number;
    paymentMethod: 'COD' | 'Razorpay';
    status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: Timestamp;
}

export type UserProfile = {
  uid: string;
  customUserId?: string;
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  providerId?: string;
  role: 'user' | 'admin';
  isProfileComplete?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastLogin: Timestamp;
}
