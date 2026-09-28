# beautylat — tienda en línea

Tienda en línea para **beautylat**, negocio de fajas, ropa, bolsas, perfumes
y accesorios en Ciudad Juárez, Chihuahua. El catálogo, pedidos, cupones,
reseñas y programa de fidelidad se administran desde `/admin`; el checkout
no procesa pagos — termina abriendo WhatsApp con el pedido prellenado para
coordinar el pago fuera del sitio.

## Stack

- **Frontend:** React 19 + TypeScript + Vite 8, React Router DOM v7 (rutas
  anidadas con layouts: `HomeLayout`, `CategoryLayout`, `SearchLayout`,
  `AdminLayout`).
- **Backend:** Supabase (Postgres + Auth + Storage), sin servidor propio.
- **Estilos:** CSS plano por componente (un `.css` junto a cada `.tsx`),
  mobile-first, variables de marca en `src/styles/theme.css`.
- **Importador de Shopify:** sube el `.zip` o `products_export.csv` de una
  exportación de Shopify (`jszip` + `papaparse`) y crea los productos.
- **Fidelidad:** QR de cada cliente generado 100% en el navegador con
  `qrcode`.
- **Despliegue:** Cloudflare Workers como sitio estático
  (`wrangler.jsonc`).

## Estructura del proyecto

```
supabase/schema.sql        Modelo de datos completo, RLS, funciones y seed
src/
  data/store.ts             Datos fijos del negocio (WhatsApp, dirección, horario)
  lib/                       Cliente de Supabase, formato, slugs, subida/compresión
                             de imágenes, importador de Shopify, QR de fidelidad
  types/                     Tipos TypeScript del modelo de datos
  context/                   Productos, pedidos, reseñas, analítica, cupones,
                             clientes, fidelidad, carrito y sesión de admin
  components/                Header, Footer, WhatsApp flotante, tarjetas de
                             producto, filtros, carrusel destacado, modales…
  layouts/                   HomeLayout, CategoryLayout, SearchLayout, AdminLayout
  pages/public/               Inicio, categorías, ofertas, buscador, producto,
                             carrito, checkout, tarjeta de fidelidad, legales
  pages/admin/                Panel, productos (lista/nuevo/editar/importar),
                             categorías, pedidos (+ baúl), reseñas, cupones,
                             clientes y niveles de fidelidad
```

## Primeros pasos (desarrollo local)

```bash
npm install
cp .env.example .env.local   # completa con tu propio proyecto de Supabase
npm run dev
```

Sin un proyecto de Supabase conectado, el sitio carga pero las pantallas que
dependen de datos se quedan vacías — sigue la guía de
[`SETUP.md`](./SETUP.md) para conectar la base de datos.

## Modelo de datos

Todo el modelo (tablas, funciones `security definer`, políticas de RLS y
seed de niveles de fidelidad) vive en un único archivo:
[`supabase/schema.sql`](./supabase/schema.sql), listo para correr completo
en el **SQL Editor** de un proyecto nuevo de Supabase.

Tablas: `products`, `product_stats`, `orders`, `reviews`, `coupons`,
`customers`, `loyalty_tiers`, `loyalty_claims`.

## Detalles incluidos

- Catálogo con 5 categorías fijas (fajas, ropa, bolsas, perfumes,
  accesorios), filtros por marca/nivel/oferta y carrusel de destacados.
- Producto con varios niveles de compresión a la vez, precio de oferta con
  badge, ficha con galería + lightbox y productos relacionados.
- Carrito persistente, cupones y checkout que termina en WhatsApp con el
  pedido completo.
- Pantalla de éxito con QR de fidelidad generado en el navegador.
- Tarjeta pública de fidelidad (`/fidelidad/:token`) con niveles, progreso y
  reclamo de recompensas (genera un cupón automáticamente al confirmarse).
- Importador de catálogo desde Shopify con detección de duplicados.

## Despliegue

Ver el checklist completo en [`SETUP.md`](./SETUP.md). En resumen:
Cloudflare Workers con integración Git, build `npm install && npm run build`,
salida `dist`, y las variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
configuradas también en el dashboard de Cloudflare (no solo en
`.env.local`, que no se sube al repositorio).
