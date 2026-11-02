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
                  <Route path="/" element={<MarketFeed />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/sell" element={<DropAsset />} />
                  <Route path="/sell/:id/edit" element={<DropAsset />} />
                  <Route path="/offers" element={<NegotiationDesk />} />
                  <Route path="/negotiation" element={<NegotiationDesk />} />
                  <Route path="/profile" element={<OperativeProfile />} />
                  <Route path="/login" element={<AuthLogin />} />
                  <Route path="/ticket" element={<SupportTicket />} />
                  <Route path="/support" element={<SupportTicket />} />
                  <Route path="/help" element={<SystemGuide />} />
                  <Route
                    path="/notifications"
                    element={<NotificationsPage />}
                  />
                </Routes>
                <Navbar />
              </div>
            </BrowserRouter>
          </CartProvider>{" "}
          {/* A tag interior fecha primeiro */}
        </CrtProvider>{" "}
        {/* A tag exterior fecha depois */}
      </AuthProvider>
    </QueryClientProvider>
  );
}
