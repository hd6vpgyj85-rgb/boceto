import { useProducts } from "../../context/ProductsContext";
import { useOrders } from "../../context/OrdersContext";
import { useReviews } from "../../context/ReviewsContext";
import { useCustomers } from "../../context/CustomersContext";
import "./adminShared.css";

export default function DashboardPage() {
  const { products } = useProducts();
  const { orders } = useOrders();
  const { reviews } = useReviews();
  const { customers } = useCustomers();

  const pendingOrders = orders.filter((o) => o.status === "pendiente" && !o.archivedAt).length;
  const pendingReviews = reviews.filter((r) => r.status === "pendiente").length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Panel</h1>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <strong>{products.length}</strong>
          <span>Productos</span>
        </div>
        <div className="admin-stat-card">
          <strong>{pendingOrders}</strong>
          <span>Pedidos pendientes</span>
        </div>
        <div className="admin-stat-card">
          <strong>{pendingReviews}</strong>
          <span>Reseñas por moderar</span>
        </div>
        <div className="admin-stat-card">
          <strong>{customers.length}</strong>
          <span>Clientes registrados</span>
        </div>
        <div className="admin-stat-card">
          <strong>{outOfStock}</strong>
          <span>Productos agotados</span>
        </div>
        <div className="admin-stat-card">
          <strong>{lowStock}</strong>
          <span>Pocas unidades (≤5)</span>
        </div>
      </div>
    </div>
  );
}
