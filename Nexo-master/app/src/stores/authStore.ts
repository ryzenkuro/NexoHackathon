import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Login: phone + password
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;

  // Register: phone + name + password, then verify OTP
  register: (phone: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyRegisterOTP: (phone: string, otp: string) => Promise<{ success: boolean; error?: string; token?: string; user?: User }>;

  // Forgot password: send OTP → verify OTP → reset password
  sendForgotPasswordOTP: (phone: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyForgotPasswordOTP: (phone: string, otp: string) => Promise<{ success: boolean; resetToken?: string; error?: string }>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Send OTP for register
  sendOTP: (phone: string) => Promise<{ success: boolean; otp?: string; error?: string }>;

  logout: () => void;
  setAuth: (auth: boolean, user?: User | null) => void;
  setBusinessCategory: (category: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      // ── Login with phone + password ──────────────────────────────────────
      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            set({ isLoading: false });
            return { success: false, error: data.error };
          }
          set({ user: data.user, isAuthenticated: true, token: data.token, isLoading: false });
          return { success: true };
        } catch {
          set({ isLoading: false });
          return { success: false, error: 'Gagal terhubung ke server' };
        }
      },

      // ── Register: validate then send OTP ────────────────────────────────
      register: async (phone, name, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, name, password }),
          });
          const data = await res.json();
          set({ isLoading: false });
          if (!res.ok) return { success: false, error: data.error };
          return { success: true };
        } catch {
          set({ isLoading: false });
          return { success: false, error: 'Gagal terhubung ke server' };
        }
      },

      // ── Verify OTP after register ────────────────────────────────────────
      verifyRegisterOTP: async (phone, otp) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/auth/register/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp }),
          });
          const data = await res.json();
          if (!res.ok) {
            set({ isLoading: false });
            return { success: false, error: data.error };
          }
          set({ token: data.token, isLoading: false });
          return { success: true, token: data.token, user: data.user };
        } catch {
          set({ isLoading: false });
          return { success: false, error: 'Gagal terhubung ke server' };
        }
      },

      // ── Forgot password: send OTP ────────────────────────────────────────
      sendForgotPasswordOTP: async (phone) => {
        try {
          const res = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };
          return { success: true, otp: data.otp };
        } catch {
          return { success: false, error: 'Gagal terhubung ke server' };
        }
      },

      // ── Forgot password: verify OTP → get reset token ────────────────────
      verifyForgotPasswordOTP: async (phone, otp) => {
        try {
          const res = await fetch(`${API_URL}/auth/forgot-password/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };
          return { success: true, resetToken: data.resetToken };
        } catch {
          return { success: false, error: 'Gagal terhubung ke server' };
        }
      },

      // ── Reset password with reset token ─────────────────────────────────
      resetPassword: async (resetToken, newPassword) => {
        try {
          const res = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetToken, newPassword }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };
          return { success: true };
        } catch {
          return { success: false, error: 'Gagal terhubung ke server' };
        }
      },

      // ── Send OTP (register flow) ─────────────────────────────────────────
      sendOTP: async (phone) => {
        try {
          const res = await fetch(`${API_URL}/auth/otp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
          });
          const data = await res.json();
          if (!res.ok) return { success: false, error: data.error };
          return { success: true, otp: data.otp };
        } catch {
          return { success: false, error: 'Gagal mengirim OTP' };
        }
      },

      // ── Logout ───────────────────────────────────────────────────────────
      logout: () => {
        const token = get().token;
        if (token) {
          fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          }).catch(() => {});
        }
        localStorage.removeItem('nexo_auth');
        localStorage.removeItem('nexo_user');
        set({ user: null, isAuthenticated: false, token: null });
      },

      setAuth: (auth, user = null) => {
        set({ isAuthenticated: auth, user });
      },

      setBusinessCategory: (category) =>
        set((state) => ({
          user: state.user ? { ...state.user, businessCategory: category, isNewUser: false } : null,
        })),
    }),
    { name: 'nexo_auth' }
  )
);
