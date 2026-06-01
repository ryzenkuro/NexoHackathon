import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  /** Tombol konfirmasi label. Default 'Ya, lanjutkan'. */
  confirmLabel?: string;
  /** Tombol batal label. Default 'Batal'. */
  cancelLabel?: string;
  /** Variant tombol konfirmasi. Default 'danger' untuk destructive. */
  variant?: 'danger' | 'primary';
}

/**
 * Reusable confirmation dialog untuk destructive actions
 * (logout, hapus akun, dll). Mengikuti Nielsen Heuristic #5
 * "Error Prevention".
 *
 * Implementation note:
 * Pakai React Portal ke document.body. Tanpa portal, dialog rentan terhadap
 * parent dengan `transform`, `filter`, atau `will-change` (animasi card,
 * fade-in-up, dll) yang membuat `position: fixed` jadi positioned terhadap
 * ancestor itu — bukan viewport.
 *
 * Behavior:
 * - Click backdrop atau Esc → batal
 * - Tombol konfirmasi punya warna match severity
 * - Body scroll lock saat dialog terbuka
 * - Auto focus tombol Batal (safer default)
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
}: ConfirmDialogProps) {
  // Esc to close + lock body scroll
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);

    // Lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const confirmClass =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : 'bg-primary hover:bg-primary-600 text-white';

  // Render via portal langsung ke <body> — immune dari parent transform/filter
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={description ? 'confirm-desc' : undefined}
    >
      {/* Backdrop: blur kuat + tinted overlay (auto-adapt light/dark) */}
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] premium-shell rounded-3xl p-6 shadow-2xl fade-in-up"
      >
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center ${
              variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className="text-base font-bold text-navy-900 mb-1">
              {title}
            </h3>
            {description && (
              <p id="confirm-desc" className="text-sm text-secondary-gray-500 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-2xl bg-white/70 px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:bg-white btn-press"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors btn-press ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
