import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Smartphone, Lock, User, ArrowRight,
  ShoppingBag, Shirt, Utensils, Laptop, Heart, Home,
  Dumbbell, BookOpen, Baby, Car, Check,
} from 'lucide-react';
import nexoLogo from '@/images/logo.png';
import { useAuthStore } from '@/stores';
import { toast } from 'sonner';

// ─── Step type ────────────────────────────────────────────────────────────────
// 'login'          : phone + password
// 'register'       : name + phone + password
// 'otp'            : OTP verification (register)
// 'category'       : pick business category (register)
// 'forgot'         : enter phone to receive OTP
// 'forgot-otp'     : verify OTP for password reset
// 'reset-password' : enter new password
type Step = 'login' | 'register' | 'otp' | 'category' | 'forgot' | 'forgot-otp' | 'reset-password';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

interface Category {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  activeBg: string;
  inactiveBg: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const categories: Category[] = [
  { id: 'fashion', label: 'Fashion & Pakaian', description: 'Baju, sepatu, aksesori', icon: <Shirt size={22} />, color: 'text-pink-500', activeBg: 'border-pink-400 bg-pink-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-pink-300 hover:bg-pink-50/50' },
  { id: 'food', label: 'Makanan & Minuman', description: 'Kuliner, snack, minuman', icon: <Utensils size={22} />, color: 'text-orange-500', activeBg: 'border-orange-400 bg-orange-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-orange-300 hover:bg-orange-50/50' },
  { id: 'electronics', label: 'Elektronik & Gadget', description: 'HP, laptop, aksesoris', icon: <Laptop size={22} />, color: 'text-blue-500', activeBg: 'border-blue-400 bg-blue-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-blue-300 hover:bg-blue-50/50' },
  { id: 'beauty', label: 'Kecantikan & Perawatan', description: 'Skincare, makeup, parfum', icon: <Heart size={22} />, color: 'text-rose-500', activeBg: 'border-rose-400 bg-rose-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-rose-300 hover:bg-rose-50/50' },
  { id: 'home', label: 'Rumah & Dekorasi', description: 'Furnitur, dekor, peralatan', icon: <Home size={22} />, color: 'text-emerald-500', activeBg: 'border-emerald-400 bg-emerald-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-emerald-300 hover:bg-emerald-50/50' },
  { id: 'sports', label: 'Olahraga & Fitness', description: 'Peralatan gym, pakaian sport', icon: <Dumbbell size={22} />, color: 'text-violet-500', activeBg: 'border-violet-400 bg-violet-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-violet-300 hover:bg-violet-50/50' },
  { id: 'education', label: 'Pendidikan & Buku', description: 'Kursus, buku, alat tulis', icon: <BookOpen size={22} />, color: 'text-amber-500', activeBg: 'border-amber-400 bg-amber-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-amber-300 hover:bg-amber-50/50' },
  { id: 'kids', label: 'Ibu & Anak', description: 'Mainan, perlengkapan bayi', icon: <Baby size={22} />, color: 'text-sky-500', activeBg: 'border-sky-400 bg-sky-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-sky-300 hover:bg-sky-50/50' },
  { id: 'automotive', label: 'Otomotif', description: 'Aksesoris kendaraan, sparepart', icon: <Car size={22} />, color: 'text-slate-500', activeBg: 'border-slate-400 bg-slate-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-slate-300 hover:bg-slate-50/50' },
  { id: 'general', label: 'Umum / Lainnya', description: 'Produk campuran atau lainnya', icon: <ShoppingBag size={22} />, color: 'text-indigo-500', activeBg: 'border-indigo-400 bg-indigo-50', inactiveBg: 'border-secondary-gray-200 bg-secondary-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validatePhone(phone: string): boolean {
  return /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(phone.replace(/\s/g, ''));
}

function inputClass(hasError: boolean): string {
  return `w-full pl-10 pr-4 py-3 rounded-2xl soft-input text-sm ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : ''
  }`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    login,
    register,
    verifyRegisterOTP,
    sendOTP,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resetPassword,
    setAuth,
    setBusinessCategory,
  } = useAuthStore();

  const [step, setStep] = useState<Step>('login');
  const [pendingUser, setPendingUser] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [resetToken, setResetToken] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '', phone: '', password: '', confirmPassword: '',
    otp: '', newPassword: '', confirmNewPassword: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devOtp, setDevOtp] = useState<string>('');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ── Form helpers ────────────────────────────────────────────────────────────

  const setField = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', password: '', confirmPassword: '', otp: '', newPassword: '', confirmNewPassword: '' });
    setFieldErrors({});
    setDevOtp('');
    setSelectedCategories([]);
    setIsSaving(false);
  };

  // ── Login: phone + password ─────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!formData.phone.trim()) errors.phone = 'Nomor WhatsApp harus diisi';
    else if (!validatePhone(formData.phone)) errors.phone = 'Format nomor tidak valid (contoh: 081234567890)';
    if (!formData.password) errors.password = 'Password harus diisi';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsLoading(true);
    const result = await login(formData.phone, formData.password);
    setIsLoading(false);

    if (result.success) {
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login gagal');
      setFieldErrors({ password: result.error || 'Nomor atau password salah' });
    }
  };

  // ── Register: validate → send OTP ───────────────────────────────────────────

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!formData.name.trim()) errors.name = 'Nama lengkap harus diisi';
    if (!formData.phone.trim()) errors.phone = 'Nomor WhatsApp harus diisi';
    else if (!validatePhone(formData.phone)) errors.phone = 'Format nomor tidak valid (contoh: 081234567890)';
    if (!formData.password) errors.password = 'Password harus diisi';
    else if (formData.password.length < 8) errors.password = 'Password minimal 8 karakter';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Password tidak cocok';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsLoading(true);
    const result = await register(formData.phone, formData.name, formData.password);
    setIsLoading(false);

    if (result.success) {
      const otpResult = await sendOTP(formData.phone);
      if (otpResult.success) {
        setDevOtp(otpResult.otp || '');
        setStep('otp');
        toast.success('OTP terkirim! Cek WhatsApp Anda.');
        if (otpResult.otp) toast.info(`Kode OTP (dev): ${otpResult.otp}`);
      } else {
        toast.error(otpResult.error || 'Gagal mengirim OTP');
      }
    } else {
      toast.error(result.error || 'Registrasi gagal');
      if (result.error?.toLowerCase().includes('nomor') || result.error?.toLowerCase().includes('phone')) {
        setFieldErrors({ phone: result.error });
      }
    }
  };

  // ── Verify OTP (register) ───────────────────────────────────────────────────

  const handleVerifyRegisterOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp.trim()) { setFieldErrors({ otp: 'OTP harus diisi' }); return; }

    setIsLoading(true);
    const result = await verifyRegisterOTP(formData.phone, formData.otp);
    setIsLoading(false);

    if (result.success) {
      setPendingUser({
        id: result.user?.id ?? '',
        name: result.user?.name ?? formData.name,
        phone: result.user?.phone ?? formData.phone,
      });
      setStep('category');
    } else {
      toast.error(result.error || 'OTP salah');
      setFieldErrors({ otp: result.error || 'OTP tidak valid' });
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────

  const handleResendOTP = async () => {
    setIsLoading(true);
    const result = await sendOTP(formData.phone);
    setIsLoading(false);
    if (result.success) {
      setDevOtp(result.otp || '');
      toast.success('OTP baru terkirim!');
      if (result.otp) toast.info(`Kode OTP (dev): ${result.otp}`);
    } else {
      toast.error(result.error || 'Gagal mengirim ulang OTP');
    }
  };

  // ── Forgot password: send OTP ───────────────────────────────────────────────

  const handleForgotSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim() || !validatePhone(formData.phone)) {
      setFieldErrors({ phone: 'Format nomor tidak valid (contoh: 081234567890)' });
      return;
    }
    setIsLoading(true);
    const result = await sendForgotPasswordOTP(formData.phone);
    setIsLoading(false);

    if (result.success) {
      setDevOtp(result.otp || '');
      setStep('forgot-otp');
      toast.success('OTP terkirim! Cek WhatsApp Anda.');
      if (result.otp) toast.info(`Kode OTP (dev): ${result.otp}`);
    } else {
      toast.error(result.error || 'Gagal mengirim OTP');
      setFieldErrors({ phone: result.error });
    }
  };

  // ── Forgot password: verify OTP ─────────────────────────────────────────────

  const handleForgotVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp.trim()) { setFieldErrors({ otp: 'OTP harus diisi' }); return; }

    setIsLoading(true);
    const result = await verifyForgotPasswordOTP(formData.phone, formData.otp);
    setIsLoading(false);

    if (result.success && result.resetToken) {
      setResetToken(result.resetToken);
      setStep('reset-password');
    } else {
      toast.error(result.error || 'OTP salah');
      setFieldErrors({ otp: result.error || 'OTP tidak valid' });
    }
  };

  // ── Reset password ──────────────────────────────────────────────────────────

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!formData.newPassword) errors.newPassword = 'Password baru harus diisi';
    else if (formData.newPassword.length < 8) errors.newPassword = 'Password minimal 8 karakter';
    if (formData.newPassword !== formData.confirmNewPassword) errors.confirmNewPassword = 'Password tidak cocok';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsLoading(true);
    const result = await resetPassword(resetToken, formData.newPassword);
    setIsLoading(false);

    if (result.success) {
      toast.success('Password berhasil diubah! Silakan login.');
      resetForm();
      setStep('login');
    } else {
      toast.error(result.error || 'Gagal mengubah password');
    }
  };

  // ── Submit kategori ─────────────────────────────────────────────────────────

  const handleCategorySubmit = (skipCategory?: boolean) => {
    if (!pendingUser) return;
    setIsSaving(true);

    const selectedLabels = skipCategory
      ? ['Umum / Lainnya']
      : categories.filter((c) => selectedCategories.includes(c.id)).map((c) => c.label);

    const businessCategory = selectedLabels.join(', ') || 'Umum / Lainnya';
    const userData = { ...pendingUser, businessCategory, isNewUser: true };

    setTimeout(() => {
      setAuth(true, userData);
      setBusinessCategory(businessCategory);
      toast.success('Selamat datang di Nexo!');
      navigate('/dashboard');
    }, 500);
  };

  // ── Step dots helper ────────────────────────────────────────────────────────

  const registerStepIndex = step === 'register' ? 1 : step === 'otp' ? 2 : step === 'category' ? 3 : 0;

  // ── Shared OTP card (register + forgot) ─────────────────────────────────────

  const isRegisterOtp = step === 'otp';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen nexo-app-bg flex items-center justify-center p-4">
      <div className={`w-full fade-in-up ${step === 'category' ? 'max-w-xl' : 'max-w-md'}`}>

        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <img src={nexoLogo} alt="Nexo Logo" width={56} height={56} className="h-14 w-14 rounded-3xl object-cover shadow-card" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-navy-900">Nexo</h1>
            <p className="text-xs font-semibold text-secondary-gray-500">AI trend cockpit</p>
          </div>
        </div>

        {/* Step dots — register flow only */}
        {(step === 'register' || step === 'otp' || step === 'category') && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: s <= registerStepIndex ? 24 : 8,
                  backgroundColor: s <= registerStepIndex ? '#6366f1' : '#e2e8f0',
                }}
              />
            ))}
          </div>
        )}

        {/* ── LOGIN ─────────────────────────────────────────────────────────── */}
        {step === 'login' && (
          <div className="premium-card rounded-3xl p-7 shadow-card fade-in sm:p-8">
            <h2 className="mb-1 text-2xl font-black text-navy-900">Masuk ke Nexo</h2>
            <p className="text-sm text-secondary-gray-500 mb-6">Lanjutkan ke dashboard tren Anda</p>

            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Nomor WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Smartphone size={18} />
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="Contoh: 081234567890"
                    autoComplete="tel"
                    inputMode="numeric"
                    className={inputClass(!!fieldErrors.phone)}
                  />
                </div>
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-navy-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setStep('forgot'); }}
                    className="text-xs text-primary hover:underline font-medium btn-press"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setField('password', e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className={`${inputClass(!!fieldErrors.password)} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-gray-500 hover:text-navy-700 btn-press"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 btn-press"
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" />
                  : <><span>Masuk</span><ArrowRight size={18} /></>
                }
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-gray-500">
                Belum punya akun?{' '}
                <button
                  onClick={() => { resetForm(); setStep('register'); }}
                  className="text-primary font-semibold hover:underline btn-press"
                >
                  Daftar
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── REGISTER ──────────────────────────────────────────────────────── */}
        {step === 'register' && (
          <div className="premium-card rounded-3xl p-7 shadow-card fade-in sm:p-8">
            <h2 className="text-xl font-bold text-navy-900 mb-1">Daftar Akun Baru</h2>
            <p className="text-sm text-secondary-gray-500 mb-6">Mulai baca tren pasar dalam 2 menit</p>

            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Contoh: Dina Rahmawati"
                    autoComplete="name"
                    className={inputClass(!!fieldErrors.name)}
                  />
                </div>
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Nomor WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Smartphone size={18} />
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="Contoh: 081234567890"
                    autoComplete="tel"
                    inputMode="numeric"
                    className={inputClass(!!fieldErrors.phone)}
                  />
                </div>
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setField('password', e.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    className={`${inputClass(!!fieldErrors.password)} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-gray-500 hover:text-navy-700 btn-press"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setField('confirmPassword', e.target.value)}
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    className={inputClass(!!fieldErrors.confirmPassword)}
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 btn-press"
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" />
                  : <><span>Lanjutkan</span><ArrowRight size={18} /></>
                }
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-gray-500">
                Sudah punya akun?{' '}
                <button
                  onClick={() => { resetForm(); setStep('login'); }}
                  className="text-primary font-semibold hover:underline btn-press"
                >
                  Masuk
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── OTP VERIFICATION (register) ───────────────────────────────────── */}
        {step === 'otp' && (
          <div className="premium-card rounded-3xl p-7 shadow-card fade-in sm:p-8">
            <h2 className="text-xl font-bold text-navy-900 mb-1">Verifikasi OTP</h2>
            <p className="text-sm text-secondary-gray-500 mb-6">
              Masukkan kode OTP yang dikirim ke <strong>{formData.phone}</strong>
            </p>

            <form onSubmit={handleVerifyRegisterOTP} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Kode OTP</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => setField('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 digit kode"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    className={`${inputClass(!!fieldErrors.otp)} text-center text-lg tracking-widest`}
                  />
                </div>
                {fieldErrors.otp && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.otp}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 btn-press"
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" />
                  : <><span>Verifikasi</span><ArrowRight size={18} /></>
                }
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="w-full py-2.5 text-sm text-primary font-medium hover:underline disabled:opacity-50 btn-press"
              >
                Kirim ulang OTP
              </button>

              <button
                type="button"
                onClick={() => setStep('register')}
                className="w-full py-2.5 text-sm text-secondary-gray-500 hover:text-navy-700 transition-colors btn-press"
              >
                Kembali
              </button>
            </form>

            {devOtp && isRegisterOtp && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 text-center">
                  <strong>Kode OTP (dev mode):</strong> {devOtp}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── CATEGORY (register) ───────────────────────────────────────────── */}
        {step === 'category' && (
          <div className="premium-card rounded-[28px] p-7 shadow-card fade-in sm:p-10">
            <h2 className="mb-2 text-[22px] font-black leading-tight text-navy-900">
              Pilih Kategori Bisnis Anda
            </h2>
            <p className="mb-8 max-w-md text-sm font-medium leading-relaxed text-primary/45">
              Kami akan menyesuaikan tren dan rekomendasi produk untuk bisnis Anda.
            </p>

            <div className="mb-8 grid grid-cols-1 gap-3 stagger-children sm:grid-cols-2">
              {categories.map((cat) => {
                const isActive = selectedCategories.includes(cat.id);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() =>
                      setSelectedCategories((prev: string[]) =>
                        prev.includes(cat.id) ? prev.filter((id: string) => id !== cat.id) : [...prev, cat.id]
                      )
                    }
                    aria-pressed={isActive}
                    className={`relative flex min-h-[70px] cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 btn-press ${
                      isActive
                        ? 'border-primary/45 bg-primary/5 shadow-[0_14px_32px_rgba(99,102,241,0.14)]'
                        : 'border-secondary-gray-200 bg-secondary-gray-50/80 hover:border-primary/25 hover:bg-white'
                    }`}
                  >
                    {isActive && (
                      <span className="badge-pop absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_18px_rgba(99,102,241,0.28)]">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <span className={`shrink-0 ${cat.color} transition-colors`}>
                      {cat.icon}
                    </span>
                    <div className="min-w-0 pr-3">
                      <p className={`truncate text-sm font-black leading-tight ${isActive ? 'text-primary' : 'text-navy-900'}`}>
                        {cat.label}
                      </p>
                      <p className="mt-1 truncate text-[11px] font-medium leading-tight text-secondary-gray-300">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleCategorySubmit()}
              disabled={selectedCategories.length === 0 || isSaving}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-[#9b8cf7] py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(99,102,241,0.24)] transition-all duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 btn-press"
            >
              {isSaving
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" />
                : <><span>Mulai Eksplorasi Tren</span><ArrowRight size={18} /></>
              }
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => handleCategorySubmit(true)}
                className="text-xs font-medium text-secondary-gray-300 transition-colors hover:text-primary btn-press"
              >
                Lewati untuk sekarang
              </button>
            </div>
          </div>
        )}

        {/* ── FORGOT PASSWORD: enter phone ──────────────────────────────────── */}
        {step === 'forgot' && (
          <div className="premium-card rounded-3xl p-7 shadow-card fade-in sm:p-8">
            <h2 className="text-xl font-bold text-navy-900 mb-1">Lupa Password</h2>
            <p className="text-sm text-secondary-gray-500 mb-6">
              Masukkan nomor WhatsApp Anda. Kami akan kirim kode OTP untuk reset password.
            </p>

            <form onSubmit={handleForgotSendOTP} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Nomor WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Smartphone size={18} />
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="Contoh: 081234567890"
                    autoComplete="tel"
                    inputMode="numeric"
                    autoFocus
                    className={inputClass(!!fieldErrors.phone)}
                  />
                </div>
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.phone}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 btn-press"
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" />
                  : <><span>Kirim OTP</span><ArrowRight size={18} /></>
                }
              </button>

              <button
                type="button"
                onClick={() => { resetForm(); setStep('login'); }}
                className="w-full py-2.5 text-sm text-secondary-gray-500 hover:text-navy-700 transition-colors btn-press"
              >
                Kembali ke Login
              </button>
            </form>
          </div>
        )}

        {/* ── FORGOT PASSWORD: verify OTP ───────────────────────────────────── */}
        {step === 'forgot-otp' && (
          <div className="premium-card rounded-3xl p-7 shadow-card fade-in sm:p-8">
            <h2 className="text-xl font-bold text-navy-900 mb-1">Verifikasi OTP</h2>
            <p className="text-sm text-secondary-gray-500 mb-6">
              Masukkan kode OTP yang dikirim ke <strong>{formData.phone}</strong>
            </p>

            <form onSubmit={handleForgotVerifyOTP} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Kode OTP</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => setField('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 digit kode"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    className={`${inputClass(!!fieldErrors.otp)} text-center text-lg tracking-widest`}
                  />
                </div>
                {fieldErrors.otp && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.otp}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 btn-press"
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" />
                  : <><span>Verifikasi</span><ArrowRight size={18} /></>
                }
              </button>

              <button
                type="button"
                onClick={() => setStep('forgot')}
                className="w-full py-2.5 text-sm text-secondary-gray-500 hover:text-navy-700 transition-colors btn-press"
              >
                Kembali
              </button>
            </form>

            {devOtp && !isRegisterOtp && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 text-center">
                  <strong>Kode OTP (dev mode):</strong> {devOtp}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── RESET PASSWORD ────────────────────────────────────────────────── */}
        {step === 'reset-password' && (
          <div className="premium-card rounded-3xl p-7 shadow-card fade-in sm:p-8">
            <h2 className="text-xl font-bold text-navy-900 mb-1">Buat Password Baru</h2>
            <p className="text-sm text-secondary-gray-500 mb-6">
              Password baru harus berbeda dari password sebelumnya.
            </p>

            <form onSubmit={handleResetPassword} noValidate className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Password Baru</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setField('newPassword', e.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    autoFocus
                    className={`${inputClass(!!fieldErrors.newPassword)} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-gray-500 hover:text-navy-700 btn-press"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.newPassword && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.newPassword}</p>}
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Konfirmasi Password Baru</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-gray-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.confirmNewPassword}
                    onChange={(e) => setField('confirmNewPassword', e.target.value)}
                    placeholder="Ulangi password baru"
                    autoComplete="new-password"
                    className={inputClass(!!fieldErrors.confirmNewPassword)}
                  />
                </div>
                {fieldErrors.confirmNewPassword && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.confirmNewPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 btn-press"
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" />
                  : <><span>Simpan Password Baru</span><ArrowRight size={18} /></>
                }
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
