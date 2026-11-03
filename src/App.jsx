import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { CrtProvider } from "./context/CrtContext";
import { CartProvider } from "./context/CartContext";
import CRTOverlay from "./components/CRTOverlay";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import MarketFeed from "./pages/MarketFeed";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import DropAsset from "./pages/DropAsset";
import NegotiationDesk from "./pages/NegotiationDesk";
import OperativeProfile from "./pages/OperativeProfile";
import Entrar from "./pages/Entrar";
import Cadastrar from "./pages/Cadastrar";
import SupportTicket from "./pages/SupportTicket";
import SystemGuide from "./pages/SystemGuide";
import NotificationsPage from "./pages/NotificationsPage";
import AdminPanel from "./pages/AdminPanel";
import AdminTickets from "./pages/AdminTickets";
import AdminRefunds from "./pages/AdminRefunds";
import AdminReports from "./pages/AdminReports";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // 401/403/404 não melhoram tentando de novo.
      retry: (count, error) => ![401, 403, 404].includes(error?.status) && count < 2,
    },
  },
});

const protect = (element) => <RequireAuth>{element}</RequireAuth>;
const adminOnly = (element) => <RequireAdmin>{element}</RequireAdmin>;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CrtProvider>
          <CartProvider>
            <BrowserRouter>
              <div className="bg-noir-950 font-mono antialiased min-h-screen relative overflow-x-hidden selection:bg-neon-pink selection:text-white">
                <CRTOverlay />
                <Routes>
                  {/* Públicas */}
                  <Route path="/" element={<MarketFeed />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/profile" element={<OperativeProfile />} />
                  <Route path="/entrar" element={<Entrar />} />
                  <Route path="/cadastrar" element={<Cadastrar />} />
                  <Route path="/login" element={<Navigate to="/entrar" replace />} />
                  <Route path="/ticket" element={<SupportTicket />} />
                  <Route path="/support" element={<SupportTicket />} />
                  <Route path="/help" element={<SystemGuide />} />

                  {/* Exigem o token (sem token → /entrar) */}
                  <Route path="/checkout" element={protect(<Checkout />)} />
                  <Route path="/sell" element={protect(<DropAsset />)} />
                  <Route path="/sell/:id/edit" element={protect(<DropAsset />)} />
                  <Route path="/offers" element={protect(<NegotiationDesk />)} />
                  <Route path="/negotiation" element={protect(<NegotiationDesk />)} />
                  <Route path="/notifications" element={protect(<NotificationsPage />)} />

                  {/* Só administrador (sem token → /entrar; sem role admin → /) */}
                  <Route path="/admin" element={adminOnly(<AdminPanel />)} />
                  <Route path="/admin/tickets" element={adminOnly(<AdminTickets />)} />
                  <Route path="/admin/reembolsos" element={adminOnly(<AdminRefunds />)} />
                  <Route path="/admin/denuncias" element={adminOnly(<AdminReports />)} />
                </Routes>
                <Navbar />
              </div>
            </BrowserRouter>
          </CartProvider>
        </CrtProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
