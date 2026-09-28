export const storeInfo = {
  name: "beautylat",
  tagline: "Fajas, ropa y accesorios para realzar tu figura",
  whatsappNumber: "526561234567",
  phone: "+52 656 123 4567",
  email: "contacto@beautylat.mx",
  address: "Av. Paseo Triunfo de la República 3401, Cd. Juárez, Chih.",
  hours: "Lunes a sábado · 10:00 a 20:00",
  instagram: "https://instagram.com/beautylat.mx",
  facebook: "https://facebook.com/beautylat.mx",
  storePhoto: "/images/store.svg",
  mapUrl: "https://maps.google.com/?q=Beautylat+Ciudad+Juarez",
};

export function getWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${storeInfo.whatsappNumber}?text=${encoded}`;
}
