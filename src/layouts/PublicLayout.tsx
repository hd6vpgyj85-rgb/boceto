import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import AddedToCartToast from "../components/AddedToCartToast";
import ScrollProgress from "../components/ScrollProgress";

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main key={location.pathname} className="page-transition">
        <Outlet />
      </main>
      <Footer variant={isHome ? "home" : "default"} />
      <WhatsAppButton />
      <AddedToCartToast />
    </>
  );
}
