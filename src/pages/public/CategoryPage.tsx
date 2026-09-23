import { useParams } from "react-router-dom";
import { useCategories } from "../../hooks/useSiteData";
import ProductListing from "./ProductListing";
import NotFound from "./NotFound";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const { categories, loading } = useCategories();

  if (!loading && !categories.some((c) => c.slug === categorySlug)) return <NotFound />;

  return <ProductListing key={categorySlug} mode="category" categorySlug={categorySlug} />;
}
