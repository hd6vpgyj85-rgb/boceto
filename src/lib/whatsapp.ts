import { formatPrice } from "./format";
import type { CartLine, OrderAddress, OrderCustomer } from "../types";

interface CheckoutMessageParams {
  items: CartLine[];
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  total: number;
  customer: OrderCustomer;
  address: OrderAddress;
  paymentMethod: string;
  notes?: string;
  reviewQuote?: string;
}

export function buildCheckoutMessage(params: CheckoutMessageParams): string {
  const { items, subtotal, discount, couponCode, total, customer, address, paymentMethod, notes, reviewQuote } =
    params;

  const lines: string[] = [];
  lines.push("*Nuevo pedido — beautylat*");
  lines.push("");
  lines.push("*Productos:*");
  for (const item of items) {
    const levelText = item.level ? ` (${item.level})` : "";
    lines.push(`• ${item.quantity}x ${item.name}${levelText} — ${formatPrice(item.price * item.quantity)}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${formatPrice(subtotal)}`);
  if (discount > 0) {
    lines.push(`Cupón${couponCode ? ` (${couponCode})` : ""}: -${formatPrice(discount)}`);
  }
  lines.push(`*Total: ${formatPrice(total)}*`);
  lines.push("");
  lines.push("*Datos del cliente:*");
  lines.push(`Nombre: ${customer.nombre} ${customer.apellido}`);
  lines.push(`Teléfono: ${customer.telefono}`);
  if (customer.correo) lines.push(`Correo: ${customer.correo}`);
  lines.push("");
  lines.push("*Dirección de envío:*");
  lines.push(`${address.calle}, ${address.colonia}`);
  lines.push(`${address.ciudad}, ${address.estado}, CP ${address.codigoPostal}`);
  lines.push(address.pais);
  if (address.referencias) lines.push(`Referencias: ${address.referencias}`);
  lines.push("");
  lines.push(`*Método de pago:* ${paymentMethod}`);
  if (notes) {
    lines.push("");
    lines.push(`*Notas:* ${notes}`);
  }
  if (reviewQuote) {
    lines.push("");
    lines.push(`*Reseña del cliente:* ${reviewQuote}`);
  }

  return lines.join("\n");
}

export function buildLoyaltyClaimMessage(customerName: string, rewardDescription: string): string {
  return [
    "*Reclamo de recompensa — beautylat*",
    "",
    `Hola, soy ${customerName} y quiero reclamar mi recompensa:`,
    `🎁 ${rewardDescription}`,
  ].join("\n");
}
