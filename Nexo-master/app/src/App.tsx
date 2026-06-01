import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore, useTrendStore } from '@/stores';
import type { InsightId, Trend } from '@/types';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ViralProducts = lazy(() => import('@/pages/ViralProducts'));
const SaturationGuard = lazy(() => import('@/pages/SaturationGuard'));
const TrendingContent = lazy(() => import('@/pages/TrendingContent'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

// Panels loaded normally (they're overlays, not routes)
import NotificationPanel from '@/components/NotificationPanel';
import ChatbotPanel from '@/components/ChatbotPanel';
import ProductDetailModal from '@/components/ProductDetailModal';
import InsightDetailModal from '@/components/InsightDetailModal';
import CommandPalette from '@/components/CommandPalette';
import { useCommandPaletteHotkey } from '@/hooks/useCommandPaletteHotkey';
import OnboardingTour from '@/components/OnboardingTour';

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 premium-card rounded-3xl shimmer" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 premium-card rounded-3xl shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-56 premium-card rounded-3xl shimmer" />
        ))}
      </div>
    </div>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { trends, setSelectedTrend } = useTrendStore();
  const [showChatbot, setShowChatbot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<InsightId | null>(null);
  const [paletteOpen, setPaletteOpen] = useCommandPaletteHotkey();

  // Redirect authenticated user away from /login
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const isLoginPage = location.pathname === '/login';

  const navigateFromInsight = (path: string) => {
    setSelectedInsight(null);
    navigate(path);
  };

  const askNexoAboutInsight = (trend: Trend) => {
    setSelectedTrend(trend);
    setSelectedInsight(null);
    setShowChatbot(true);
  };

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={200}>
        <div className="min-h-screen nexo-app-bg">
          <Toaster position="top-right" richColors />

        {isLoginPage ? (
          <Suspense fallback={<div className="min-h-screen nexo-app-bg" />}>
            {/*
              Auth pages selalu di-render dengan theme cerah, tidak peduli
              user preference dark mode. Class `light-scope` di-target
              di `dark-mode.css` untuk membatalkan dark override.
            */}
            <div className="light-scope">
              <Routes key="login">
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </Suspense>
        ) : (
          <RequireAuth>
            <div className="flex min-h-screen fade-in">
              <Sidebar />

              <div className="flex-1 flex flex-col ml-0 md:ml-[276px]">
                <Navbar
                  onChatToggle={() => setShowChatbot((v) => !v)}
                  onNotifToggle={() => setShowNotifications((v) => !v)}
                  onOpenProduct={() => setShowProductModal(true)}
                />

                <main className="flex-1 px-4 sm:px-5 md:px-8 pt-28 md:pt-28 pb-24 md:pb-8">
                  <div className="mx-auto w-full max-w-[1180px]">
                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      <Route
                        path="/dashboard"
                        element={
                          <Dashboard
                            onOpenChat={() => setShowChatbot(true)}
                            onOpenProduct={() => setShowProductModal(true)}
                            onOpenInsight={setSelectedInsight}
                          />
                        }
                      />
                      <Route
                        path="/viral-products"
                        element={
                          <ViralProducts
                            onOpenChat={() => setShowChatbot(true)}
                            onOpenProduct={() => setShowProductModal(true)}
                          />
                        }
                      />
                      <Route path="/saturation-guard" element={<SaturationGuard />} />
                      <Route
                        path="/trending-content"
                        element={<TrendingContent onOpenChat={() => setShowChatbot(true)} />}
                      />
                      <Route
                        path="/notifications"
                        element={
                          <NotificationsPage onOpenProduct={() => setShowProductModal(true)} />
                        }
                      />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                  </div>
                </main>
              </div>

              {/* Mobile Bottom Navigation */}
              <BottomNav
                onOpenChat={() => setShowChatbot(true)}
                onOpenNotif={() => setShowNotifications(true)}
              />

              {/* Command Palette (Cmd+K / Ctrl+K) */}
              <CommandPalette
                open={paletteOpen}
                onOpenChange={setPaletteOpen}
                onOpenProduct={() => setShowProductModal(true)}
              />

              {/* Onboarding tour for first-time users */}
              <OnboardingTour />

              {/* Overlays with CSS transitions */}
              {showChatbot && (
                <>
                  <div
                    className="fixed inset-0 z-[49] modal-backdrop overlay-fade"
                    onClick={() => setShowChatbot(false)}
                    aria-hidden="true"
                  />
                  <div className="slide-in-right fixed top-0 right-0 h-screen w-full sm:w-[420px] premium-shell shadow-2xl z-50">
                    <ChatbotPanel onClose={() => setShowChatbot(false)} />
                  </div>
                </>
              )}

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-[49] modal-backdrop overlay-fade"
                    onClick={() => setShowNotifications(false)}
                    aria-hidden="true"
                  />
                  <div className="slide-in-right fixed top-0 right-0 h-screen w-full sm:w-[390px] premium-shell shadow-2xl z-50">
                    <NotificationPanel
                      onClose={() => setShowNotifications(false)}
                      onOpenProduct={() => { setShowProductModal(true); setShowNotifications(false); }}
                    />
                  </div>
                </>
              )}

              {showProductModal && (
                <>
                  <div
                    className="fixed inset-0 z-[49] modal-backdrop overlay-fade"
                    onClick={() => setShowProductModal(false)}
                    aria-hidden="true"
                  />
                  <div className="slide-in-up fixed inset-0 z-50 flex items-center justify-center p-4">
                    <ProductDetailModal
                      onClose={() => setShowProductModal(false)}
                      onOpenChat={() => { setShowChatbot(true); setShowProductModal(false); }}
                    />
                  </div>
                </>
              )}

              {selectedInsight && (
                <>
                  <div
                    className="fixed inset-0 z-[49] modal-backdrop overlay-fade"
                    onClick={() => setSelectedInsight(null)}
                    aria-hidden="true"
                  />
                  <div className="slide-in-up fixed inset-0 z-50 flex items-center justify-center p-4">
                    <InsightDetailModal
                      insightId={selectedInsight}
                      trends={trends}
                      onClose={() => setSelectedInsight(null)}
                      onNavigate={navigateFromInsight}
                      onAskNexo={askNexoAboutInsight}
                    />
                  </div>
                </>
              )}
            </div>
          </RequireAuth>
        )}
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
