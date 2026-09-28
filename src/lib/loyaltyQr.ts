import QRCode from "qrcode";

export function getLoyaltyCardUrl(token: string): string {
  return `${window.location.origin}/fidelidad/${token}`;
}

export async function generateLoyaltyQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(getLoyaltyCardUrl(token), {
    width: 320,
    margin: 1,
    color: { dark: "#3a0d1f", light: "#ffffff" },
  });
}
