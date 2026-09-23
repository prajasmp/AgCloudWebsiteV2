import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { OrderProvider } from './context/OrderContext';
import Preloader from './components/Preloader';
import BackgroundAnimation from './components/BackgroundAnimation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Plans from './pages/Plans';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Dashboard from './pages/Dashboard';
import Panel from './pages/Panel';
import ServerManage from './pages/ServerManage';
import Admin from './pages/Admin';
import Legal from './pages/Legal';
import TrackOrder from './pages/TrackOrder';

export default function App() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.8,
    });

    let animationFrameId;

    function raf(time) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CurrencyProvider>
          <OrderProvider>
            {!loadingComplete && (
              <Preloader onComplete={() => setLoadingComplete(true)} />
            )}
            <div className={`app-shell ${loadingComplete ? 'app-loaded' : ''}`}>
              <BackgroundAnimation />
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/plans/:category" element={<Plans />} />
                  <Route path="/checkout/:planId" element={<Checkout />} />
                  <Route path="/order-success/:id" element={<OrderSuccess />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/panel" element={<Panel />} />
                  <Route path="/panel/server/:serverId" element={<ServerManage />} />
                  <Route path="/admin" element={<Admin mode="orders" />} />
                  <Route path="/admin-emails" element={<Admin mode="emails" />} />
                  <Route path="/terms" element={<Legal />} />
                  <Route path="/refund-policy" element={<Legal />} />
                  <Route path="/privacy" element={<Legal />} />
                  <Route path="/contact" element={<Legal />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </OrderProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
