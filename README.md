# NOIRE Perfumería — plantilla de tienda en línea

Plantilla completa y vendible de e-commerce para negocios locales (ropa,
gorras, velas, joyería, cosmética, comida, perfumería, etc.). Este
repositorio trae una tienda de demostración 100% funcional y con contenido
ficticio realista (**NOIRE Perfumería**, Medellín, Colombia) para que se
pueda mostrar como demo antes de venderla. Cada comprador clona este mismo
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
  config/catalog.ts        Slugs fijos de categorías y niveles (ver SETUP.md)
  lib/                      Cliente de Supabase, utilidades (WhatsApp, moneda,
                            subida/compresión de imágenes, CSV)
  types/                    Tipos TypeScript del modelo de datos
  context/                  CartContext (carrito) y AuthContext (sesión admin)
  hooks/                    Datos del sitio (site_settings, categorías, niveles…)
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
identidad del negocio, contacto, redes sociales, horario, categorías,
niveles, banner de inicio, productos, reseñas, cupones, clientes y niveles
de fidelidad.

Lo poco que **sí** requiere tocar código está marcado en el código fuente
con el comentario `[MODIFICAR MANUAL]`, y todo está listado con su ruta
exacta en [`SETUP.md`](./SETUP.md): credenciales de Supabase, SEO estático
(`index.html`), variables de entorno en Cloudflare, la cantidad de
categorías/niveles (`src/config/catalog.ts`), el color de acento
(`theme.css`), el usuario administrador inicial (se crea desde el dashboard
de Supabase) y el contenido de Términos y Privacidad.

## Despliegue

Ver el checklist completo en [`SETUP.md`](./SETUP.md). En resumen:
Cloudflare Workers con integración Git, build command
`npm install && npm run build`, directorio de salida `dist`, y las dos
variables de entorno de Supabase configuradas en el dashboard de Cloudflare
(no solo en `.env`, que no se sube al repositorio).

## Licencia / uso

Plantilla de uso comercial: pensada para revenderse como producto, una
copia por cliente final.
