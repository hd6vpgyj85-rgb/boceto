# SETUP — Puesta en marcha de una copia nueva

Checklist para dejar esta plantilla lista para un negocio nuevo. Todo lo que
está marcado en el código con `[MODIFICAR MANUAL]` aparece aquí con su
ubicación exacta. Todo lo demás (nombre del negocio, productos, categorías,
niveles, banner, reseñas, cupones, fidelidad, redes sociales, horario, etc.)
se edita desde `/admin` una vez el sitio está desplegado — **no hace falta
tocar código para eso**.

## 0. Antes de empezar

- [ ] Ten a mano: cuenta de [Supabase](https://supabase.com), cuenta de
      [Cloudflare](https://dash.cloudflare.com), y este repositorio clonado o
      "usado como plantilla" en GitHub.

## 1. Crear el proyecto de Supabase

- [ ] Crea un proyecto nuevo en Supabase (elige una contraseña de base de
      datos y guárdala).
- [ ] Ve a **SQL Editor** → pega el contenido completo de
      [`supabase/schema.sql`](./supabase/schema.sql) → **Run**. Es
      idempotente: si algo falla puedes corregir y volver a correrlo entero
      sin duplicar datos.
- [ ] Verifica en **Table Editor** que existan filas de ejemplo en
      `site_settings`, `levels`, `categories`, `products`, `reviews`,
      `home_banner`, `coupons` y `loyalty_tiers` (el script las siembra solo
      si las tablas están vacías).
- [ ] Ve a **Storage** y confirma que el bucket `product-images` existe y es
      público (el script lo crea, pero revisa que el toggle "Public" esté
      activo).

## 2. Crear el usuario administrador

- [ ] **☐ [MODIFICAR MANUAL] — Supabase Dashboard → Authentication → Users →
      "Add user"**. Crea el correo y contraseña del primer administrador a
      mano. **El sitio no tiene pantalla de registro por seguridad** — la
      lógica de login vive en `src/context/AuthContext.tsx` y
      `src/pages/public/Login.tsx`, pero el usuario en sí se crea desde el
      dashboard de Supabase, no desde el código ni desde la app.
- [ ] Confirma que puedes entrar en `/admin/login` con ese correo y
      contraseña una vez el sitio esté corriendo.

## 3. Variables de entorno (credenciales de Supabase)

- [ ] **☐ [MODIFICAR MANUAL] — `.env.example`** (raíz del repo). Copia este
      archivo como `.env` (no se sube al repositorio) y completa:
      ```
      VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
      VITE_SUPABASE_ANON_KEY=tu-anon-public-key
      ```
      Ambos valores están en Supabase → **Project Settings → API**.
- [ ] **☐ [MODIFICAR MANUAL] — `src/lib/supabase.ts`**. No hay que editar
      este archivo directamente (ya lee las variables de entorno), pero es
      donde se usan — si algo no conecta, revisa aquí primero.
- [ ] **☐ [MODIFICAR MANUAL] — Cloudflare Workers → tu proyecto → Settings →
      Variables and Secrets**. Duplica ahí las dos mismas variables
      (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). El archivo `.env`
      local **no se sube al repositorio**, así que el build en la nube no lo
      ve — sin este paso el sitio publicado no va a conectar con tu base de
      datos.

## 4. Categorías y niveles (cantidad fija en código)

- [ ] **☐ [MODIFICAR MANUAL] — `src/config/catalog.ts`**. El *nombre*,
      *imagen* y *tagline* de cada categoría y nivel ya se editan desde
      `/admin` sin tocar código. Pero la **cantidad** de categorías y
      niveles, y sus slugs internos, están fijados aquí y en las rutas de
      `src/App.tsx`. Si vas a usar las 3 categorías y los 3 niveles de
      ejemplo (perfumería árabe/diseñador/nicho), no necesitas tocar nada:
      solo edita sus nombres desde el admin. Si vas a agregar, quitar o
      renombrar el *slug* de una categoría o nivel:
      1. Edita `CATEGORY_SLUGS` o `LEVEL_SLUGS` en este archivo.
      2. Si agregaste una categoría nueva, sus filas en Supabase no se crean
         solas — insértala a mano en la tabla `categories` (o `levels`) desde
         el Table Editor, con ese mismo slug.
      3. Las rutas de categoría se generan automáticamente desde
         `CATEGORY_SLUGS` en `src/App.tsx`, así que no hace falta tocar el
         router.

## 5. Identidad visual

- [ ] **☐ [MODIFICAR MANUAL] — `src/styles/theme.css`**, variable
      `--color-accent` (y `--color-accent-rgb`, `--color-accent-light`,
      `--color-accent-dark`). Es el único lugar donde vive el color de marca
      — no es editable desde el admin a propósito, para no complicar el
      build. Cámbialo si el comprador no quiere el neón naranja de ejemplo.
- [ ] **☐ [MODIFICAR MANUAL] — `public/favicon.svg`** y
      **`index.html`** (`<title>`, meta `description`, Open Graph
      title/description/image, favicon). Estos valores son SEO estático: se
      sirven como HTML plano antes de que la app cargue datos de Supabase,
      por eso no son editables desde el admin. Reemplázalos con el nombre,
      descripción e imagen reales del negocio.
- [ ] Opcional: reemplaza `public/og-image.svg` por una imagen de marca real
      para las previsualizaciones al compartir el link (WhatsApp, redes).

## 6. Contenido legal

- [ ] **☐ [MODIFICAR MANUAL] — `src/pages/public/Terms.tsx`** y
      **`src/pages/public/Privacy.tsx`**. Contienen términos y política de
      privacidad de ejemplo, no conectados al admin. Reemplaza el texto por
      el real del negocio (o pide asesoría legal) antes de publicar.

## 7. Reemplazar el contenido de ejemplo

Todo esto se hace **desde `/admin`**, sin tocar código:

- [ ] **Configuración del negocio** (ícono de engranaje en el header del
      admin, o `/admin/configuracion`): nombre, tagline, logo, WhatsApp,
      teléfono, correo, dirección, ciudad, horario, redes sociales, foto del
      local y nota del pie de página.
- [ ] **Categorías** (`/admin/categorias`): nombre, tagline e imagen de
      banner de cada una.
- [ ] **Contenido de inicio** (`/admin/contenido-inicio`): imágenes del
      banner promocional y foto/etiqueta de cada nivel.
- [ ] **Productos** (`/admin/productos`): borra los 19 productos de ejemplo
      y carga los reales (uno por uno o por CSV/Shopify).
- [ ] **Clientes → Niveles de fidelidad** (`/admin/clientes`, al final de la
      página): ajusta los 3 niveles de recompensas de ejemplo.
- [ ] **Cupones** (`/admin/cupones`): desactiva o elimina el cupón de
      ejemplo `BIENVENIDA10` si no aplica.
- [ ] **Reseñas** (`/admin/resenas`): elimina las reseñas de ejemplo cuando
      tengas reseñas reales de clientes (o déjalas como referencia inicial).

## 8. Desplegar en Cloudflare Workers

- [ ] Conecta el repositorio de GitHub en Cloudflare Workers (Compute →
      Workers → Import a repository / Git integration).
- [ ] Build command: `npm install && npm run build`.
- [ ] Output/assets directory: `dist`.
- [ ] Agrega las variables de entorno del paso 3 en **Settings → Variables
      and Secrets**.
- [ ] Despliega. Cada push a la rama configurada vuelve a construir el sitio
      automáticamente.

## 9. Verificación final

- [ ] Entra a `/admin/login` con el usuario del paso 2 y confirma acceso al
      panel.
- [ ] Haz un pedido de prueba desde el checkout y confirma que llega el
      mensaje de WhatsApp y que el pedido aparece en `/admin/pedidos`.
- [ ] Escanea el QR de la tarjeta de fidelidad generada y confirma que abre
      `/fidelidad/:token` correctamente.
- [ ] Revisa el sitio en un celular real (no solo en el navegador de
      escritorio) antes de entregarlo al cliente final.
