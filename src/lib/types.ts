
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
  productId: string;
  quantity: number;
  variantId?: string;
};

export type PopulatedCartItem = {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
}

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

export type OrderStatus = 'placed' | 'pending_payment' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'paid';


export type Order = {
    id: string;
    orderNumber: string;
    userId: string;
    items: OrderItem[];
    shippingInfo: ShippingInfo;
    subtotal: number;
    shipping: number;
    totalAmount: number;

    paymentMethod: 'cod' | 'phonepe' | 'googlepay' | 'razorpay';
    status: OrderStatus;
    createdAt: Timestamp;
    statusUpdatedAt?: Timestamp;
    trackingId?: string;
    courierName?: string;
    estDeliveryDate?: Timestamp;
    statusHistory?: {
      status: OrderStatus;
      changedAt: Timestamp;
    }[];
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
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  lastLogin: Timestamp | string;
  cart?: CartItem[];
}

    