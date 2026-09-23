export interface SiteSettings {
  id: true;
  business_name: string;
  tagline: string;
  logo_url: string | null;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  hours: string;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  map_url: string | null;
  footer_note: string;
  store_photo_url: string | null;
  hero_title: string;
  announcement: string;
  currency: string;
  updated_at: string;
}

export interface Level {
  slug: string;
  label: string;
  image_url: string | null;
  tagline: string | null;
  display_order: number;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string | null;
  banner_image_url: string | null;
  display_order: number;
}

export interface HomeBanner {
  id: true;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  on_sale: boolean;
  levels: string[];
  category: string | null;
  brand: string;
  stock: number;
  vendor: string;
  sizes: string[];
  description: string;
  images: string[];
  cover_fit: "cover" | "contain";
  featured: boolean;
  created_at: string;
}

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface OrderItem {
  product_id: string;
  name: string;
  image: string | null;
  price: number;
  size: string | null;
  quantity: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  city: string;
  payment_method: string;
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  total: number;
  created_at: string;
  archived_at: string | null;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  name: string;
  rating: number;
  quote: string;
  image_url: string | null;
  status: ReviewStatus;
  created_at: string;
}

export interface ProductStats {
  product_id: string;
  views: number;
  cart_adds: number;
  purchases: number;
}

export type DiscountType = "percentage" | "fixed";
export type CouponScope = "single_product" | "cart";

export interface Coupon {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  scope: CouponScope;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  token: string;
  access_code: string | null;
  purchases: number;
  notes: string | null;
  created_at: string;
}

export interface LoyaltyTier {
  id: string;
  required_purchases: number;
  reward_description: string;
  discount_percent: number | null;
  coupon_scope: CouponScope;
  display_order: number;
}

export interface LoyaltyClaim {
  id: string;
  customer_id: string;
  tier_id: string;
  claimed: boolean;
  claimed_at: string | null;
  coupon_code: string | null;
  created_at: string;
}

export interface CartLine {
  productId: string;
  name: string;
  image: string | null;
  price: number;
  size: string | null;
  quantity: number;
  stock: number;
}
