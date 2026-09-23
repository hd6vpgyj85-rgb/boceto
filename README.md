# Boceto — plantilla de tienda en línea

Plantilla completa y vendible de e-commerce para negocios locales de
cualquier giro. Este repositorio trae una tienda de demostración 100%
funcional con contenido genérico de tienda (**Boceto**: productos, kits,
ofertas, reseñas y recompensas de ejemplo) para que se pueda mostrar como
demo antes de venderla. Cada comprador clona este mismo
repositorio, crea su propio proyecto de Supabase, y reemplaza casi toda la
información del negocio **desde el panel de administración**, sin tocar
código.

## Stack

- **Frontend:** React 19 + TypeScript + Vite, React Router DOM v7 (rutas
  anidadas con layouts).
- **Backend:** Supabase (Postgres + Auth + Storage), sin servidor propio.
- **Estilos:** CSS plano por componente (un `.css` junto a cada `.tsx`),
  variables globales de tema en `src/styles/theme.css`.
- **Despliegue:** Cloudflare Workers, con integración Git (build automático
  en cada push).

Sin frameworks de UI (nada de Bootstrap/Tailwind/MUI) — todo hecho a mano
con CSS.

## Estructura del proyecto

```
supabase/schema.sql        Modelo de datos completo, RLS, funciones y seed
src/
  lib/                      Cliente de Supabase, utilidades (WhatsApp, moneda,
                            subida/compresión de imágenes, CSV)
  types/                    Tipos TypeScript del modelo de datos
  context/                  Carrito, sesión admin, datos del sitio (settings,
                            categorías, niveles) y notificaciones (toasts)
  hooks/                    Título de página, contadores animados, scroll…
  styles/theme.css          Variables de marca (color, tipografía, radios)
  components/               Header, Footer, tarjetas, carruseles, lightbox…
  layouts/                  PublicLayout y AdminLayout
  pages/public/             Inicio, categorías, producto, carrito, checkout,
                            buscador, tarjeta de fidelidad, login, legales
  pages/admin/               Panel, productos, categorías, pedidos, reseñas,
                            cupones, clientes/fidelidad, contenido de inicio,
                            configuración del negocio
```

## Primeros pasos (desarrollo local)

```bash
npm install
cp .env.example .env   # completa con tu propio proyecto de Supabase
npm run dev
```

Antes de tener un proyecto de Supabase propio, el sitio carga pero las
pantallas que dependen de datos se quedan en estado de carga — sigue la
guía de [`SETUP.md`](./SETUP.md) para conectar tu base de datos.

## Modelo de datos

Todo el modelo (tablas, funciones `security definer`, políticas de RLS y
los datos de ejemplo) vive en un único archivo idempotente:
[`supabase/schema.sql`](./supabase/schema.sql). Se puede correr las veces
que hagan falta en el **SQL Editor** de Supabase sin duplicar datos ni
romper lo que ya existe.

Tablas principales: `site_settings`, `levels`, `categories`, `home_banner`,
`products`, `orders`, `reviews`, `product_stats`, `coupons`, `customers`,
`loyalty_tiers`, `loyalty_claims`.

## Qué es editable desde `/admin` y qué no

**Casi todo** se edita desde el panel de administración sin tocar código:
identidad del negocio, título de portada, moneda,
contacto, redes sociales, horario, categorías (crear, editar y eliminar),
niveles, banner de inicio, productos, pedidos, reseñas, cupones, clientes y
niveles de fidelidad.

Lo poco que **sí** requiere tocar código está marcado en el código fuente
con el comentario `[MODIFICAR MANUAL]`, y todo está listado con su ruta
exacta en [`SETUP.md`](./SETUP.md): credenciales de Supabase, SEO estático
(`index.html`), variables de entorno en Cloudflare, el nombre del Worker
(`wrangler.toml`), el color de acento (`theme.css`), el usuario administrador inicial (se crea desde el dashboard
de Supabase) y el contenido de Términos y Privacidad.

## Detalles incluidos

- Catálogo con filtros por nivel, ordenamiento (destacados, recientes,
  precio, nombre), búsqueda en vivo y páginas de categoría dinámicas.
- Ficha de producto con galería y lightbox, variantes, stock visible,
  porcentaje de descuento, productos relacionados y botón de compartir.
- Carrito persistente, cupones, checkout en pasos con confirmación por
  WhatsApp y referencia de pedido.
- Tarjeta de recompensas digital con QR, progreso animado y reclamo de
  recompensas.
- Panel con ventas del mes, alertas de pendientes, pedidos recientes,
  notificaciones (toasts) en cada acción y animaciones sutiles en todo el
  sitio (respetando `prefers-reduced-motion`).

## Despliegue

Ver el checklist completo en [`SETUP.md`](./SETUP.md). En resumen:
Cloudflare Workers con integración Git, build command
`npm install && npm run build`, directorio de salida `dist`, y las dos
variables de entorno de Supabase configuradas en el dashboard de Cloudflare
(no solo en `.env`, que no se sube al repositorio).

## Licencia / uso

Plantilla de uso comercial: pensada para revenderse como producto, una
copia por cliente final.
