import JSZip from "jszip";
import Papa from "papaparse";
import type { Category, ProductLevel } from "../types";
import { normalizeSearch, uniqueSlug } from "./slug";

interface ShopifyRow {
  Handle?: string;
  Title?: string;
  "Body (HTML)"?: string;
  Vendor?: string;
  Type?: string;
  Tags?: string;
  Published?: string;
  "Option1 Name"?: string;
  "Option1 Value"?: string;
  "Option2 Name"?: string;
  "Option2 Value"?: string;
  "Variant Price"?: string;
  "Variant Compare At Price"?: string;
  "Variant Inventory Qty"?: string;
  "Image Src"?: string;
  "Image Position"?: string;
}

export interface ImportDraft {
  handle: string;
  suggestedId: string;
  name: string;
  description: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  onSale: boolean;
  stock: number;
  sizes: string[];
  images: string[];
  category: Category;
  levels: ProductLevel[];
  isDuplicate: boolean;
}

const CATEGORY_KEYWORDS: [Category, string[]][] = [
  ["fajas", ["faja", "fajas", "shapewear", "moldeador", "moldeadora"]],
  ["bolsas", ["bolsa", "bolso", "handbag", "cartera", "mochila"]],
  ["perfumes", ["perfume", "fragancia", "eau de", "colonia"]],
  ["accesorios", ["accesorio", "joyeria", "joyería", "lente", "cinturon", "cinturón", "reloj"]],
  ["ropa", ["ropa", "vestido", "blusa", "pantalon", "pantalón", "conjunto", "top", "short"]],
];

function guessCategory(type: string, tags: string): Category {
  const haystack = normalizeSearch(`${type} ${tags}`);
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(normalizeSearch(k)))) return category;
  }
  return "ropa";
}

function guessLevels(tags: string): ProductLevel[] {
  const haystack = normalizeSearch(tags);
  const levels: ProductLevel[] = [];
  if (haystack.includes("moderada")) levels.push("compresion-moderada");
  if (haystack.includes(normalizeSearch("compresión alta")) || haystack.includes("compresionalta"))
    levels.push("compresion-alta");
  if (haystack.includes("extrafirme")) levels.push("compresion-extra-firme");
  return levels;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractCsvText(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith(".zip")) {
    const zip = await JSZip.loadAsync(file);
    const csvEntry = Object.values(zip.files).find(
      (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".csv")
    );
    if (!csvEntry) throw new Error("El .zip no contiene un archivo products_export.csv");
    return csvEntry.async("text");
  }
  return file.text();
}

export async function parseShopifyFile(
  file: File,
  existingProducts: { id: string; name: string }[]
): Promise<ImportDraft[]> {
  const csvText = await extractCsvText(file);
  const parsed = Papa.parse<ShopifyRow>(csvText, { header: true, skipEmptyLines: true });

  const groups = new Map<string, ShopifyRow[]>();
  for (const row of parsed.data) {
    const handle = row.Handle?.trim();
    if (!handle) continue;
    if (!groups.has(handle)) groups.set(handle, []);
    groups.get(handle)!.push(row);
  }

  const existingIds = new Set(existingProducts.map((p) => p.id));
  const existingNames = new Set(existingProducts.map((p) => normalizeSearch(p.name)));
  const usedIds = new Set(existingIds);
  const drafts: ImportDraft[] = [];

  for (const [handle, rows] of groups) {
    const titleRow = rows.find((r) => r.Title?.trim()) ?? rows[0];
    const name = titleRow.Title?.trim() || handle;
    if (!name) continue;

    const bodyRow = rows.find((r) => r["Body (HTML)"]?.trim());
    const description = bodyRow ? stripHtml(bodyRow["Body (HTML)"] ?? "") : "";
    const brand = titleRow.Vendor?.trim() || "beautylat";
    const type = titleRow.Type?.trim() || "";
    const tags = titleRow.Tags?.trim() || "";

    const prices = rows
      .map((r) => parseFloat(r["Variant Price"] ?? ""))
      .filter((v) => !isNaN(v) && v > 0);
    const price = prices.length ? Math.min(...prices) : 0;

    const compareAtPrices = rows
      .map((r) => parseFloat(r["Variant Compare At Price"] ?? ""))
      .filter((v) => !isNaN(v) && v > 0);
    const compareAtPrice = compareAtPrices.length ? Math.max(...compareAtPrices) : null;
    const onSale = compareAtPrice !== null && compareAtPrice > price;

    const stock = rows.reduce((sum, r) => {
      const qty = parseInt(r["Variant Inventory Qty"] ?? "", 10);
      return sum + (isNaN(qty) ? 0 : qty);
    }, 0);

    const sizeSet = new Set<string>();
    for (const r of rows) {
      for (const [nameKey, valueKey] of [
        ["Option1 Name", "Option1 Value"],
        ["Option2 Name", "Option2 Value"],
      ] as const) {
        const optName = normalizeSearch(r[nameKey] ?? "");
        const optValue = r[valueKey]?.trim();
        if (optValue && (optName.includes("talla") || optName.includes("size"))) {
          sizeSet.add(optValue);
        }
      }
    }

    const images = rows
      .filter((r) => r["Image Src"]?.trim())
      .sort((a, b) => Number(a["Image Position"] ?? 0) - Number(b["Image Position"] ?? 0))
      .map((r) => r["Image Src"]!.trim());
    const uniqueImages = Array.from(new Set(images));

    const isDuplicate = existingNames.has(normalizeSearch(name));
    const suggestedId = uniqueSlug(name, usedIds);
    usedIds.add(suggestedId);

    drafts.push({
      handle,
      suggestedId,
      name,
      description,
      brand,
      price,
      compareAtPrice,
      onSale,
      stock,
      sizes: Array.from(sizeSet),
      images: uniqueImages,
      category: guessCategory(type, tags),
      levels: guessLevels(tags),
      isDuplicate,
    });
  }

  return drafts;
}
