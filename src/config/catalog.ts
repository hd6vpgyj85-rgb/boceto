// [MODIFICAR MANUAL] Slugs fijos de niveles y categorías. La ETIQUETA, imagen y
// tagline de cada uno se editan desde el panel de admin (tablas `levels` y
// `categories`), pero agregar o quitar un nivel/categoría implica tocar este
// archivo y las rutas en src/App.tsx, porque el filtrado y las páginas de
// categoría dependen de esta lista en tiempo de compilación.

export const LEVEL_SLUGS = ["arabe", "disenador", "nicho"] as const;
export type LevelSlug = (typeof LEVEL_SLUGS)[number];

export const CATEGORY_SLUGS = ["perfumes", "splash-corporal", "difusores"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
