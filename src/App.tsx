import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import { OrdersProvider } from "./context/OrdersContext";
import { ReviewsProvider } from "./context/ReviewsContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import { CouponsProvider } from "./context/CouponsContext";
import { CustomersProvider } from "./context/CustomersContext";
import { LoyaltyProvider } from "./context/LoyaltyContext";

import ScrollToTop from "./components/ScrollToTop";

import HomeLayout from "./layouts/HomeLayout";
import CategoryLayout from "./layouts/CategoryLayout";
import SearchLayout from "./layouts/SearchLayout";
import AdminLayout from "./layouts/AdminLayout";

import HomePage from "./pages/public/HomePage";
import CategoryPage from "./pages/public/CategoryPage";
import OfertasPage from "./pages/public/OfertasPage";
import SearchPage from "./pages/public/SearchPage";
import ProductDetailPage from "./pages/public/ProductDetailPage";
import CartPage from "./pages/public/CartPage";
import CheckoutPage from "./pages/public/CheckoutPage";
import FidelidadPage from "./pages/public/FidelidadPage";
import TerminosPage from "./pages/public/TerminosPage";
import PrivacidadPage from "./pages/public/PrivacidadPage";
import NotFoundPage from "./pages/public/NotFoundPage";

import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/ProductsPage";
import ProductFormPage from "./pages/admin/ProductFormPage";
const ProductImportPage = lazy(() => import("./pages/admin/ProductImportPage"));
import CategoriesPage from "./pages/admin/CategoriesPage";
import OrdersPage from "./pages/admin/OrdersPage";
import OrdersArchivePage from "./pages/admin/OrdersArchivePage";
import ReviewsPage from "./pages/admin/ReviewsPage";
import CouponsPage from "./pages/admin/CouponsPage";
import NewCouponPage from "./pages/admin/NewCouponPage";
import CustomersPage from "./pages/admin/CustomersPage";
import LoadingSpinner from "./components/LoadingSpinner";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <OrdersProvider>
            <ReviewsProvider>
              <AnalyticsProvider>
                <CouponsProvider>
                  <CustomersProvider>
                    <LoyaltyProvider>
                      <CartProvider>
                        <ScrollToTop />
                        <Routes>
                          <Route element={<HomeLayout />}>
                            <Route path="/" element={<HomePage />} />
                          </Route>

                          <Route element={<CategoryLayout />}>
                            <Route path="/fajas" element={<CategoryPage category="fajas" />} />
                            <Route path="/ropa" element={<CategoryPage category="ropa" />} />
                            <Route path="/bolsas" element={<CategoryPage category="bolsas" />} />
                            <Route path="/perfumes" element={<CategoryPage category="perfumes" />} />
                            <Route path="/accesorios" element={<CategoryPage category="accesorios" />} />
                            <Route path="/ofertas" element={<OfertasPage />} />
                            <Route path="/producto/:id" element={<ProductDetailPage />} />
                            <Route path="/carrito" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/terminos" element={<TerminosPage />} />
                            <Route path="/privacidad" element={<PrivacidadPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                          </Route>

                          <Route element={<SearchLayout />}>
                            <Route path="/buscar" element={<SearchPage />} />
                          </Route>

                          <Route path="/fidelidad/:token" element={<FidelidadPage />} />

                          <Route path="/admin/login" element={<LoginPage />} />
                          <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<DashboardPage />} />
                            <Route path="productos" element={<ProductsPage />} />
                            <Route path="productos/nuevo" element={<ProductFormPage />} />
                            <Route
                              path="productos/importar"
                              element={
                                <Suspense fallback={<LoadingSpinner />}>
                                  <ProductImportPage />
                                </Suspense>
                              }
                            />
                            <Route path="productos/:id" element={<ProductFormPage />} />
                            <Route path="categorias" element={<CategoriesPage />} />
                            <Route path="pedidos" element={<OrdersPage />} />
                            <Route path="pedidos/baul" element={<OrdersArchivePage />} />
                            <Route path="resenas" element={<ReviewsPage />} />
                            <Route path="cupones" element={<CouponsPage />} />
                            <Route path="cupones/nuevo" element={<NewCouponPage />} />
                            <Route path="clientes" element={<CustomersPage />} />
                          </Route>
                        </Routes>
                      </CartProvider>
                    </LoyaltyProvider>
                  </CustomersProvider>
                </CouponsProvider>
              </AnalyticsProvider>
            </ReviewsProvider>
          </OrdersProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
