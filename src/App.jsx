import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import CRTOverlay from './components/CRTOverlay';
import Navbar from './components/Navbar';

import MarketFeed from './pages/MarketFeed';
import ProductDetails from './pages/ProductDetails';
import DropAsset from './pages/DropAsset';
import NegotiationDesk from './pages/NegotiationDesk';
import OperativeProfile from './pages/OperativeProfile';
import AuthLogin from './pages/AuthLogin';
import SupportTicket from './pages/SupportTicket';
import SystemGuide from './pages/SystemGuide';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="bg-noir-950 font-mono antialiased min-h-screen relative overflow-x-hidden selection:bg-neon-pink selection:text-white">
          <CRTOverlay />
          <Routes>
            <Route path="/" element={<MarketFeed />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/sell" element={<DropAsset />} />
            <Route path="/offers" element={<NegotiationDesk />} />
            <Route path="/profile" element={<OperativeProfile />} />
            <Route path="/login" element={<AuthLogin />} />
            <Route path="/ticket" element={<SupportTicket />} />
            <Route path="/help" element={<SystemGuide />} />
          </Routes>
          <Navbar />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}