import { useProducts } from "../../context/ProductsContext";
import { CATEGORIES } from "../../types";
import "./adminShared.css";

export default function CategoriesPage() {
  const { products } = useProducts();

  return (
    <div>
      <div className="admin-page-header">
        <h1>Categorías</h1>
      </div>

      <div className="admin-list">
        {CATEGORIES.map((category) => {
          const count = products.filter((p) => p.category === category.slug).length;
          return (
            <div className="admin-list-item" key={category.slug}>
              <img src={category.image} alt="" />
              <div className="admin-list-item-info">
                <strong>{category.name}</strong>
                <span>{count} productos</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
