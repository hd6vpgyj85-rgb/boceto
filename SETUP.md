# SETUP — Puesta en marcha de beautylat

Checklist para dejar el sitio funcionando de punta a punta. A diferencia de
una plantilla genérica, aquí las categorías, el WhatsApp de la tienda, los
colores y los textos legales están **fijos en el código** (no hay un panel
de "configuración del sitio"): lo que sí se administra desde `/admin` es el
catálogo, los pedidos, las reseñas, los cupones y los clientes/fidelidad.

## 1. Crear el proyecto de Supabase

- [ ] Crea un proyecto nuevo en [Supabase](https://supabase.com).
- [ ] Ve a **SQL Editor** → pega el contenido completo de
      [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.
- [ ] Ve a **Storage** → crea un bucket público llamado
      `product-images` (usado tanto para fotos de producto como de
      reseñas).
- [ ] Verifica en **Table Editor** que `loyalty_tiers` tenga los 3 niveles
      de ejemplo sembrados por el script.

## 2. Crear el usuario administrador

- [ ] Supabase Dashboard → **Authentication → Users → Add user**. Crea el
      correo y contraseña del primer administrador (no hay pantalla de
      registro público por seguridad).
- [ ] Confirma que puedes entrar en `/admin/login` con ese correo y
      contraseña una vez el sitio esté corriendo.

## 3. Variables de entorno

- [ ] Copia `.env.example` como `.env.local` y completa con los valores de
      Supabase → **Project Settings → API**:
      ```
      VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
      VITE_SUPABASE_ANON_KEY=tu-anon-public-key
      ```
- [ ] En Cloudflare Workers → tu proyecto → **Settings → Variables and
      Secrets**, agrega esas mismas dos variables. `.env.local` no se sube
      al repositorio, así que el build en la nube no las ve sin este paso.

## 4. Datos fijos del negocio

- [ ] **`src/data/store.ts`**: número de WhatsApp, dirección, horario,
      redes sociales y foto de la tienda.
- [ ] **`src/types/index.ts`** (`CATEGORIES`): nombre, tagline e imagen de
      cada una de las 5 categorías (fajas, ropa, bolsas, perfumes,
      accesorios).
- [ ] **`public/images/`**: reemplaza los SVG de marcador de posición
      (`hero.svg`, `store.svg`, `category-*.svg`) por fotos reales de la
      tienda y el catálogo, con el mismo nombre de archivo.
- [ ] **`src/styles/theme.css`**: colores de marca (`--color-primary`,
      `--color-accent`, etc.) y tipografías (`--font-display`,
      `--font-body`).
- [ ] **`public/favicon.svg`**, **`public/og-image.svg`** e **`index.html`**
      (`<title>`, meta `description`, Open Graph): SEO estático, se sirve
      antes de que la app cargue datos de Supabase.
- [ ] **`src/pages/public/TerminosPage.tsx`** y
      **`src/pages/public/PrivacidadPage.tsx`**: textos legales de ejemplo,
      reemplázalos por los reales del negocio.
- [ ] **`wrangler.jsonc`**, campo `name`: debe coincidir con el nombre del
      Worker creado en Cloudflare.

## 5. Cargar el catálogo real

Desde `/admin/productos`:

- [ ] Carga productos uno por uno con **+ Nuevo**, o usa
      **Importar** para subir el `.zip` o `products_export.csv` de una
      exportación de Shopify (revisa categoría, marca y nivel de cada
      producto antes de confirmar la importación).
- [ ] Ajusta los niveles del programa de fidelidad desde
      `/admin/clientes` (sección plegable al final de la página).
- [ ] Revisa cupones de ejemplo en `/admin/cupones`.

## 6. Desplegar en Cloudflare Workers

- [ ] Conecta el repositorio en Cloudflare Workers (Compute → Workers →
      Import a repository / Git integration).
- [ ] Build command: `npm install && npm run build`.
- [ ] Output/assets directory: `dist`.
- [ ] Agrega las variables de entorno del paso 3.
- [ ] Despliega. Cada push a la rama configurada vuelve a construir el
      sitio automáticamente.

## 7. Verificación final

- [ ] Entra a `/admin/login` y confirma acceso al panel.
- [ ] Haz un pedido de prueba desde el checkout y confirma que abre
      WhatsApp con el mensaje completo y que el pedido aparece en
      `/admin/pedidos`.
- [ ] Escanea el QR de fidelidad generado al finalizar el pedido y confirma
      que abre `/fidelidad/:token` correctamente.
- [ ] Revisa el sitio en un celular real antes de entregarlo al cliente
      final.
