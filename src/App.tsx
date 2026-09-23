import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { CATEGORY_SLUGS } from "./config/catalog";

import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/public/Home";
import ProductListing from "./pages/public/ProductListing";
import ProductDetail from "./pages/public/ProductDetail";
import Cart from "./pages/public/Cart";
import Checkout from "./pages/public/Checkout";
import Search from "./pages/public/Search";
import LoyaltyCard from "./pages/public/LoyaltyCard";
import Login from "./pages/public/Login";
import Terms from "./pages/public/Terms";
import Privacy from "./pages/public/Privacy";

import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Orders from "./pages/admin/Orders";
import Reviews from "./pages/admin/Reviews";
import Coupons from "./pages/admin/Coupons";
import Customers from "./pages/admin/Customers";
import HomeContent from "./pages/admin/HomeContent";
import SiteSettingsPage from "./pages/admin/SiteSettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              {CATEGORY_SLUGS.map((slug) => (
                <Route key={slug} path={slug} element={<ProductListing mode="category" categorySlug={slug} />} />
              ))}
              <Route path="/productos" element={<ProductListing mode="all" />} />
              <Route path="/ofertas" element={<ProductListing mode="offers" />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/buscar" element={<Search />} />
              <Route path="/terminos" element={<Terms />} />
              <Route path="/privacidad" element={<Privacy />} />
            </Route>

            <Route path="/admin/login" element={<Login />} />
            <Route path="/fidelidad/:token" element={<LoyaltyCard />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="productos" element={<Products />} />
              <Route path="categorias" element={<Categories />} />
              <Route path="pedidos" element={<Orders />} />
              <Route path="resenas" element={<Reviews />} />
              <Route path="cupones" element={<Coupons />} />
              <Route path="clientes" element={<Customers />} />
              <Route path="contenido-inicio" element={<HomeContent />} />
              <Route path="configuracion" element={<SiteSettingsPage />} />
            </Route>

            <Route path="*" element={<Home />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
