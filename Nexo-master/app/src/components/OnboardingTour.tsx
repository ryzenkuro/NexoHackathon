import { useEffect, useLayoutEffect, useState } from 'react';
import { useAuthStore } from '@/stores';

interface Step {
  /** Selector data-tour attribute pada elemen target */
  target: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: 'welcome',
    title: 'Selamat datang di Nexo',
    body: 'Saya akan kasih insight tren pasar real-time untuk bisnis UMKM Anda. Ayo lihat-lihat sebentar.',
  },
  {
    target: 'stats-row',
    title: 'Ringkasan tren hari ini',
    body: 'Empat angka penting: jumlah tren aktif, tren baru muncul, kejenuhan rata-rata, dan jam peluang terdekat.',
  },
  {
    target: 'trend-grid',
    title: 'Klik tren untuk detail',
    body: 'Tap kartu produk untuk lihat saturasi, harga rata-rata, kompetitor, dan rekomendasi langsung dari Nexo.',
  },
  {
    target: 'chat-cta',
    title: 'Tanya saya apa saja',
    body: 'Klik tombol "Tanya Nexo" untuk dapat strategi modal, marketing, atau analisis kompetitor langsung di chat.',
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Onboarding tour 4 langkah untuk user baru (isNewUser === true).
 * Tour selesai → set isNewUser=false di authStore (lewat setBusinessCategory/manual setUser).
 *
 * Cara dipakai:
 *   <OnboardingTour />  // di App.tsx, setelah RequireAuth
 *
 * Halaman target wajib pasang `data-tour="<step.target>"` di elemen yang relevan
 * (contoh di Dashboard.tsx).
 */
export default function OnboardingTour() {
  const { user, setAuth } = useAuthStore();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [active, setActive] = useState(false);

  // Activate only for new users on dashboard
  useEffect(() => {
    if (user?.isNewUser && window.location.pathname === '/dashboard') {
      // Slight delay so first render & data fetch settle
      const t = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(t);
    }
  }, [user?.isNewUser]);

  // Compute target rect when step or window resizes
  useLayoutEffect(() => {
    if (!active) return;

    const measure = () => {
      const step = STEPS[stepIdx];
      if (!step) return;
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!el) {
        // If target not found (e.g. step references element below the fold),
        // center the tooltip without spotlight
        setRect(null);
        return;
      }
      // Scroll into view first
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Measure after scroll settles
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }, 350);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, stepIdx]);

  // Keyboard: Escape closes the tour, ArrowRight = next, ArrowLeft = back
  useEffect(() => {
    if (!active || !user) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setActive(false);
        setAuth(true, { ...user, isNewUser: false });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStepIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, user, setAuth]);

  if (!active || !user) return null;

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const finish = () => {
    setActive(false);
    // Mark user as no longer new (persisted via Zustand persist middleware)
    setAuth(true, { ...user, isNewUser: false });
  };

  // Tooltip positioning: below the spotlight if there's room, else above
  const tooltipPos: React.CSSProperties = (() => {
    if (!rect) {
      // Center
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const tooltipHeight = 180;
    const margin = 16;
    const showBelow = rect.top + rect.height + tooltipHeight + margin < window.innerHeight;
    const top = showBelow
      ? rect.top + rect.height + margin
      : Math.max(margin, rect.top - tooltipHeight - margin);
    const left = Math.max(
      margin,
      Math.min(window.innerWidth - 320 - margin, rect.left + rect.width / 2 - 160)
    );
    return { top, left };
  })();

  return (
    <>
      {/* Spotlight overlay using box-shadow trick */}
      <div
        className="fixed inset-0 z-[100] pointer-events-none"
        aria-hidden="true"
        style={{
          background: rect ? 'transparent' : 'rgba(11, 20, 55, 0.6)',
          transition: 'background 200ms ease-out',
        }}
      >
        {rect && (
          <div
            className="absolute rounded-2xl pointer-events-none transition-all duration-300"
            style={{
              top: rect.top - 8,
              left: rect.left - 8,
              width: rect.width + 16,
              height: rect.height + 16,
              boxShadow: '0 0 0 9999px rgba(11, 20, 55, 0.65)',
            }}
          />
        )}
      </div>

      {/* Tooltip card */}
      <div
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-body"
        className="fixed z-[101] w-[320px] premium-shell rounded-3xl p-5 shadow-2xl fade-in-up"
        style={tooltipPos}
      >
        <div className="flex items-center gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIdx ? 'w-6 bg-primary' : 'w-1.5 bg-secondary-gray-200'
              }`}
            />
          ))}
        </div>
        <h3 id="onboarding-title" className="text-base font-bold text-navy-900 mb-1">
          {step.title}
        </h3>
        <p id="onboarding-body" className="text-sm text-secondary-gray-500 mb-4">
          {step.body}
        </p>
        <div className="flex items-center justify-between">
          <button
            onClick={finish}
            className="text-xs text-secondary-gray-500 hover:text-navy-700 btn-press"
          >
            Lewati
          </button>
          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <button
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="rounded-2xl px-3 py-1.5 text-xs font-bold text-navy-700 hover:bg-white/75 btn-press"
              >
                Kembali
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStepIdx((i) => i + 1)}
              className="rounded-2xl bg-navy-900 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary btn-press"
            >
              {isLast ? 'Mulai Eksplorasi' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
