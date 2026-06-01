import { cn } from '@/lib/utils';

interface NotifBadgeProps {
  count: number;
  /** Maximum number to display before showing "X+". Default 9. */
  max?: number;
  className?: string;
}

/**
 * Reusable notification badge with consistent sizing across Sidebar,
 * Navbar, and BottomNav. Renders nothing when count is 0.
 *
 * Size: 18×18px circle with text-xs (12px). Meets WCAG 2.5.5 with the
 * surrounding hit area of the parent button.
 */
export default function NotifBadge({ count, max = 9, className }: NotifBadgeProps) {
  if (count <= 0) return null;
  const display = count > max ? `${max}+` : String(count);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold leading-none badge-pop',
        className
      )}
    >
      {display}
    </span>
  );
}
