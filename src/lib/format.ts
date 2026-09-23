export const CURRENCIES: { code: string; label: string; locale: string }[] = [
  { code: "MXN", label: "Peso mexicano (MXN)", locale: "es-MX" },
  { code: "USD", label: "Dólar estadounidense (USD)", locale: "es-US" },
  { code: "COP", label: "Peso colombiano (COP)", locale: "es-CO" },
  { code: "ARS", label: "Peso argentino (ARS)", locale: "es-AR" },
  { code: "CLP", label: "Peso chileno (CLP)", locale: "es-CL" },
  { code: "PEN", label: "Sol peruano (PEN)", locale: "es-PE" },
  { code: "GTQ", label: "Quetzal (GTQ)", locale: "es-GT" },
  { code: "EUR", label: "Euro (EUR)", locale: "es-ES" },
];

let formatter = createFormatter("MXN");

function createFormatter(code: string) {
  const currency = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  });
}

export function setCurrency(code: string | null | undefined) {
  formatter = createFormatter(code || "MXN");
}

export function formatCurrency(value: number): string {
  return formatter.format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function discountPercent(price: number, salePrice: number | null): number {
  if (salePrice == null || price <= 0 || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
