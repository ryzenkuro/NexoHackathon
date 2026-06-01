interface ToggleProps {
  /** State on/off */
  checked: boolean;
  /** Callback ketika state berubah */
  onChange: (next: boolean) => void;
  /** Aria label untuk a11y */
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Toggle switch pattern.
 * Off = knob di kiri, bg abu. On = knob di kanan, bg primary.
 *
 * Implementasi: pakai `left` + transition, bukan `translate-x` + `absolute`
 * tanpa anchor. Lebih predictable di kondisi React rerender / Tailwind
 * arbitrary class purge.
 */
export default function Toggle({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
  className = '',
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed btn-press ${
        checked ? 'bg-primary' : 'bg-secondary-gray-300'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
