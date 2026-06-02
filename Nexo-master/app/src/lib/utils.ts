import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Trend } from '@/types';
import type React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Saturation helpers ───────────────────────────────────────────────────────

export type SaturationStyle = {
  dot: string;
  label: string;
  text: string;
  bg: string;
  border: string;
  bar: string;
};

export function getSaturationStyle(sat: number): SaturationStyle {
  if (sat <= 30)
    return {
      dot: 'bg-green-500',
      label: 'Aman',
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      bar: 'bg-green-500',
    };
  if (sat <= 60)
    return {
      dot: 'bg-orange-500',
      label: 'Waspada',
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      bar: 'bg-orange-500',
    };
  return {
    dot: 'bg-red-500',
    label: 'Jenuh',
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
  };
}

export function getSaturationDecision(sat: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  if (sat <= 30)
    return {
      label: 'Peluang Terbuka',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    };
  if (sat <= 60)
    return {
      label: 'Pertimbangkan Ulang',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    };
  return {
    label: 'Hindari Saat Ini',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  };
}

// ─── Phase helpers ────────────────────────────────────────────────────────────

export function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'Emerging':
      return 'phase-badge phase-badge-emerging';
    case 'Growing':
      return 'phase-badge phase-badge-growing';
    case 'Peak':
      return 'phase-badge phase-badge-peak';
    case 'Decay':
      return 'phase-badge phase-badge-decay';
    default:
      return 'phase-badge phase-badge-default';
  }
}

// ─── Category label ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  'rumah-tangga': 'Rumah Tangga',
  elektronik: 'Elektronik',
  fashion: 'Fashion',
  kecantikan: 'Kecantikan',
  makanan: 'Makanan',
};

export function getCategoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}

// ─── Number / currency helpers ────────────────────────────────────────────────

export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

/**
 * Format growth % dengan sign yang benar (+/-).
 * Negatif otomatis dari Number.toString, positif kita tambahkan '+'.
 * Untuk angka 0 → "0%" (tidak ada sign, netral).
 */
export function formatGrowth(value: number): string {
  if (value > 0) return `+${value}%`;
  return `${value}%`;
}

/**
 * Tailwind text color class yang match dengan growth direction.
 * Naik = hijau, turun = merah, stagnan = abu.
 */
export function getGrowthColor(value: number): string {
  if (value > 5) return 'text-green-600';
  if (value < -5) return 'text-red-600';
  return 'text-secondary-gray-600';
}

export function hideBrokenImage(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  image.removeAttribute('src');
  image.style.opacity = '0';
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export function getStoredAuth(): { name: string; phone: string } | null {
  try {
    const raw = localStorage.getItem('nexo_user');
    if (!raw) return null;
    return JSON.parse(raw) as { name: string; phone: string };
  } catch {
    return null;
  }
}

export function clearStoredAuth(): void {
  localStorage.removeItem('nexo_auth');
  localStorage.removeItem('nexo_user');
}

// ─── Trend stats computed from real data ─────────────────────────────────────

export function computeDashboardStats(trends: Trend[]) {
  if (trends.length === 0) {
    return { active: 0, emerging: 0, avgSaturation: 0, minWindow: 0 };
  }

  const active = trends.length;
  const emerging = trends.filter((t) => t.phase === 'Emerging').length;
  const avgSaturation = Math.round(
    trends.reduce((sum, t) => sum + t.saturation, 0) / trends.length
  );
  const minWindow = Math.min(...trends.map((t) => t.windowHours));
  return { active, emerging, avgSaturation, minWindow };
}

// ─── Keyboard helpers ─────────────────────────────────────────────────────────

/**
 * Activate handler when user presses Enter or Space on a role="button" element.
 * Native <button> already supports both keys; use this only for div/span with role="button".
 */
export function onActivateKey<T>(handler: (e: React.KeyboardEvent<T>) => void) {
  return (e: React.KeyboardEvent<T>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  };
}
