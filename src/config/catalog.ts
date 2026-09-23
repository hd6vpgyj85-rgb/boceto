// [MODIFICAR MANUAL] Slugs fijos de categorías. Su ETIQUETA, imagen y tagline
// se editan desde el panel de admin (tabla `categories`), pero agregar o
// quitar una categoría implica tocar este archivo y las rutas en
// src/App.tsx, porque las páginas de categoría dependen de esta lista en
// tiempo de compilación.
//
// Los NIVELES (tabla `levels`) ya no tienen esta restricción: se pueden
// crear, renombrar y eliminar libremente desde /admin → "Contenido de
// inicio" — el filtro de niveles del catálogo y del buscador los lee
// directo de la base de datos, sin lista fija en el código.

export const CATEGORY_SLUGS = ["perfumes", "splash-corporal", "difusores"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
