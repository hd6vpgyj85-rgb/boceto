import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Product, ProductLevel } from "../types";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  on_sale: boolean;
  levels: string[] | null;
  category: string;
  brand: string;
  stock: number;
  vendor: string | null;
  sizes: string[] | null;
  description: string | null;
  images: string[] | null;
  home_image_fit: "cover" | "contain";
  created_at: string;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price !== null ? Number(row.compare_at_price) : null,
    onSale: row.on_sale,
    levels: (row.levels ?? []) as ProductLevel[],
    category: row.category as Product["category"],
    brand: row.brand,
    stock: row.stock,
    vendor: row.vendor,
    sizes: row.sizes ?? [],
    description: row.description,
    images: row.images ?? [],
    homeImageFit: row.home_image_fit,
    createdAt: row.created_at,
  };
}

function productToRow(product: Product): Omit<ProductRow, "created_at"> {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    compare_at_price: product.compareAtPrice ?? null,
    on_sale: product.onSale ?? false,
    levels: product.levels ?? [],
    category: product.category,
    brand: product.brand,
    stock: product.stock,
    vendor: product.vendor ?? null,
    sizes: product.sizes ?? [],
    description: product.description ?? null,
    images: product.images ?? [],
    home_image_fit: product.homeImageFit ?? "cover",
  };
}

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  refresh: () => Promise<void>;
  getById: (id: string) => Product | undefined;
  createProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteAllProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setProducts((data as ProductRow[]).map(rowToProduct));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getById = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  const createProduct = async (product: Product) => {
    const { error } = await supabase.from("products").insert(productToRow(product));
    if (error) throw error;
    await refresh();
  };

  const updateProduct = async (product: Product) => {
    const { error } = await supabase.from("products").update(productToRow(product)).eq("id", product.id);
    if (error) throw error;
    await refresh();
  };

  const deleteProduct = async (id: string) => {
    const { error, count } = await supabase.from("products").delete({ count: "exact" }).eq("id", id);
    if (error) throw error;
    if (!count) throw new Error("No se pudo eliminar el producto (bloqueado por permisos)");
    await refresh();
  };

  const deleteAllProducts = async () => {
    const { error, count } = await supabase
      .from("products")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (error) throw error;
    if (!count) throw new Error("No se eliminó ningún producto (bloqueado por permisos)");
    await refresh();
  };

  return (
    <ProductsContext.Provider
      value={{ products, loading, refresh, getById, createProduct, updateProduct, deleteProduct, deleteAllProducts }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts debe usarse dentro de <ProductsProvider>");
  return ctx;
}
