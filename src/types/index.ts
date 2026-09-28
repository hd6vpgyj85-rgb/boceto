export type Category = "fajas" | "ropa" | "bolsas" | "perfumes" | "accesorios";

export type ProductLevel = "compresion-moderada" | "compresion-alta" | "compresion-extra-firme";

export const LEVEL_LABELS: Record<ProductLevel, string> = {
  "compresion-moderada": "Compresión moderada",
  "compresion-alta": "Compresión alta",
  "compresion-extra-firme": "Compresión extra firme",
};

export const CATEGORIES: { slug: Category; name: string; tagline: string; image: string }[] = [
  {
    slug: "fajas",
    name: "Fajas",
    tagline: "Moldea tu figura con control real",
    image: "/images/category-fajas.svg",
  },
  {
    slug: "ropa",
    name: "Ropa",
    tagline: "Piezas para lucir todos los días",
    image: "/images/category-ropa.svg",
  },
  {
    slug: "bolsas",
    name: "Bolsas",
    tagline: "El accesorio que completa tu look",
    image: "/images/category-bolsas.svg",
  },
  {
    slug: "perfumes",
    name: "Perfumes",
    tagline: "Aromas que se quedan contigo",
    image: "/images/category-perfumes.svg",
  },
  {
    slug: "accesorios",
    name: "Accesorios",
    tagline: "Detalles que marcan la diferencia",
    image: "/images/category-accesorios.svg",
  },
];

export interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  onSale?: boolean;
  levels?: ProductLevel[];
  category: Category;
  brand: string;
  stock: number;
  vendor?: string | null;
  sizes?: string[];
  description?: string | null;
  images?: string[];
  homeImageFit?: "cover" | "contain";
  createdAt: string;
}

export interface ProductStat {
  productId: string;
  views: number;
  cartAdds: number;
  purchases: number;
}

export type OrderStatus = "pendiente" | "en proceso" | "completado" | "cancelado";

export interface OrderCustomer {
  nombre: string;
  apellido: string;
  telefono: string;
  correo?: string;
}

export interface OrderAddress {
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  pais: string;
  referencias?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  level?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: OrderCustomer;
  address: OrderAddress;
  paymentMethod: string;
  notes?: string | null;
  items: OrderItem[];
  total: number;
  archivedAt?: string | null;
}

export type ReviewStatus = "pendiente" | "aprobada" | "rechazada";

export interface Review {
  id: string;
  name: string;
  rating: number;
  quote: string;
  image?: string | null;
  status: ReviewStatus;
  createdAt: string;
}

export type DiscountType = "percentage" | "fixed";

export interface Coupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  usageLimit: number;
  timesUsed: number;
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  token: string;
  purchasesCount: number;
  notes?: string | null;
  createdAt: string;
}

export interface LoyaltyTier {
  id: string;
  purchasesRequired: number;
  rewardDescription: string;
  discountPercent?: number | null;
  createdAt: string;
}

export interface LoyaltyClaim {
  tierId: string;
  requestedAt: string;
  claimed: boolean;
  claimedAt?: string | null;
  couponCode?: string | null;
}

export interface LoyaltyClaimAdmin extends LoyaltyClaim {
  id: string;
  customerId: string;
}

export interface CartLine {
  productId: string;
  name: string;
  image: string | null;
  price: number;
  level?: string;
  quantity: number;
  stock: number;
}
