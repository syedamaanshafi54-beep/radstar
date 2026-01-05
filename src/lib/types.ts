
import { type StaticImageData } from "next/image";
import { type Timestamp } from "firebase/firestore";
import { type WithId } from "@/firebase";

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
  stock?: number;
};

export type Product = {
  id: string;
  slug: string;
  stock?: number;
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
  product: WithId<Product>;
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
  // Vendor-related fields
  isVendor?: boolean;
  vendorId?: string;
  vendorName?: string;
}

// Vendor Management Types
export type VendorLocation = {
  type: 'manual' | 'geolocation';
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

export type BulkDiscountTier = {
  minQuantity: number;
  discount: number; // Percentage
};

export type VendorStatus = 'pending' | 'approved' | 'rejected';

export type Vendor = {
  id: string;
  userId: string;
  businessName: string;
  businessType: 'Retailer' | 'Wholesaler' | 'Distributor' | 'Other';
  phone: string;
  email: string;
  location: VendorLocation;
  defaultDiscount: number; // Percentage (e.g., 10 means 10%)
  productDiscounts?: Record<string, number>; // productId -> discount percentage
  bulkDiscountTiers?: BulkDiscountTier[];
  status: VendorStatus;
  appliedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string; // Admin UID
  lastModifiedAt?: Timestamp;
  lastModifiedBy?: string; // Admin UID
};

export type VendorDiscountChangeType = 'default' | 'product' | 'bulk_tier';

export type VendorDiscountHistory = {
  id: string;
  vendorId: string;
  vendorName: string;
  productId?: string;
  productName?: string;
  changeType: VendorDiscountChangeType;
  previousValue: any;
  newValue: any;
  changedBy: string; // Admin UID
  changedByName: string;
  changedAt: Timestamp;
  notes?: string;
};

