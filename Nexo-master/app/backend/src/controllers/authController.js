import bcrypt from 'bcryptjs';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { signToken, verifyJwt } from '../lib/jwt.js';
import { shouldUseDevAuth, shouldShowDevOtp } from '../lib/runtime.js';
import {
  devForgotPassword,
  devLoginUser,
  devLogout,
  devRegisterUser,
  devResetPassword,
  devSendOtp,
  devVerifyForgotPasswordOtp,
  devVerifyRegisterOtp,
  devVerifyToken,
} from '../services/devAuthStore.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetToken() {
  return 'rst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function validatePhone(phone) {
  return /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(phone.replace(/\s/g, ''));
}

function cleanPhone(phone) {
  return phone.replace(/\s/g, '');
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    businessCategory: row.business_category ?? 'Umum',
  };
}

const OTP_TTL_MS = 5 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function useDevAuth() {
  return shouldUseDevAuth() || !isSupabaseConfigured || !supabase;
}

// ─── Register ────────────────────────────────────────────────────────────────
// Create unverified user. OTP is sent separately via /otp/send.

export async function registerUser(req, res) {
  try {
    const { phone, name, password } = req.body;

    if (!phone || !name || !password) {
      return res.status(400).json({ error: 'Nomor, nama, dan password harus diisi' });
    }

    const normalized = cleanPhone(phone);
    if (!validatePhone(normalized)) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter' });
    }

    if (useDevAuth()) {
      const result = await devRegisterUser({ phone: normalized, name, password });
      return res.status(result.status).json(result.body);
    }

    // Check if phone already taken (verified)
    const { data: existing, error: selectErr } = await supabase
      .from('users')
      .select('id, verified')
      .eq('phone', normalized)
      .maybeSingle();

    if (selectErr) {
      console.error('[register] select error:', selectErr);
      return res.status(500).json({ error: 'Gagal melakukan registrasi' });
    }

    const passwordHash = await hashPassword(password);

    if (existing) {
      if (existing.verified) {
        return res.status(409).json({ error: 'Nomor ini sudah terdaftar. Silakan login.' });
      }
      // Update unverified record so user can re-register / try again
      const { error: updErr } = await supabase
        .from('users')
        .update({ name: name.trim(), password_hash: passwordHash })
        .eq('id', existing.id);
      if (updErr) {
        console.error('[register] update error:', updErr);
        return res.status(500).json({ error: 'Gagal melakukan registrasi' });
      }
    } else {
      const { error: insErr } = await supabase.from('users').insert({
        phone: normalized,
        name: name.trim(),
        password_hash: passwordHash,
        business_category: 'Umum',
        verified: false,
      });
      if (insErr) {
        console.error('[register] insert error:', insErr);
        return res.status(500).json({ error: 'Gagal melakukan registrasi' });
      }
    }

    return res.json({ message: 'Registrasi berhasil. Silakan verifikasi OTP.' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Gagal melakukan registrasi' });
  }
}

// ─── Send OTP (register verification) ────────────────────────────────────────

export async function sendOTP(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Nomor WhatsApp harus diisi' });
    }

    const normalized = cleanPhone(phone);
    if (!validatePhone(normalized)) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid' });
    }

    if (useDevAuth()) {
      const result = devSendOtp({ phone: normalized, purpose: 'register' });
      return res.status(result.status).json(result.body);
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error: insErr } = await supabase.from('otps').insert({
      phone: normalized,
      otp,
      purpose: 'register',
      expires_at: expiresAt,
      used: false,
    });
    if (insErr) {
      console.error('[sendOTP] insert error:', insErr);
      return res.status(500).json({ error: 'Gagal mengirim OTP' });
    }

    // TODO: Send OTP via WhatsApp API (Fonnte / Twilio)
    if (shouldShowDevOtp()) {
      console.log(`[OTP][register] Phone: ${normalized}, Code: ${otp}`);
    }

    return res.json({
      message: 'OTP terkirim',
      ...(shouldShowDevOtp() && { otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Gagal mengirim OTP' });
  }
}

// ─── Verify OTP (register) ───────────────────────────────────────────────────

export async function verifyRegisterOTP(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Nomor dan OTP harus diisi' });
    }

    const normalized = cleanPhone(phone);

    if (useDevAuth()) {
      const result = devVerifyRegisterOtp({ phone: normalized, otp });
      return res.status(result.status).json(result.body);
    }

    // Find latest unused OTP for this phone
    const { data: otpRow, error: otpErr } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', normalized)
      .eq('purpose', 'register')
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpErr) {
      console.error('[verifyRegisterOTP] otp lookup error:', otpErr);
      return res.status(500).json({ error: 'Gagal verifikasi OTP' });
    }
    if (!otpRow) {
      return res.status(400).json({ error: 'OTP tidak ditemukan, silakan minta ulang' });
    }
    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'OTP sudah expired, silakan minta ulang' });
    }
    if (otpRow.otp !== otp) {
      return res.status(400).json({ error: 'OTP salah, silakan coba lagi' });
    }

    // Lookup user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalized)
      .maybeSingle();

    if (userErr || !user) {
      return res.status(400).json({ error: 'Data registrasi tidak ditemukan, silakan daftar ulang' });
    }

    // Mark user verified + OTP used
    const [{ error: updUserErr }, { error: updOtpErr }] = await Promise.all([
      supabase.from('users').update({ verified: true }).eq('id', user.id),
      supabase.from('otps').update({ used: true }).eq('id', otpRow.id),
    ]);
    if (updUserErr || updOtpErr) {
      console.error('[verifyRegisterOTP] update error:', updUserErr || updOtpErr);
      return res.status(500).json({ error: 'Gagal verifikasi OTP' });
    }

    // Issue JWT + persist session row (for revocation on logout)
    const safeUser = sanitizeUser(user);
    const token = signToken({ sub: user.id, phone: user.phone });
    const { error: sessErr } = await supabase.from('sessions').insert({
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    });
    if (sessErr) {
      console.error('[verifyRegisterOTP] session insert error:', sessErr);
      // non-fatal, JWT still works without DB session row
    }

    return res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Verify register OTP error:', error);
    return res.status(500).json({ error: 'Gagal verifikasi OTP' });
  }
}

// ─── Login (phone + password) ────────────────────────────────────────────────

export async function loginUser(req, res) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Nomor dan password harus diisi' });
    }

    const normalized = cleanPhone(phone);
    if (!validatePhone(normalized)) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid' });
    }

    if (useDevAuth()) {
      const result = await devLoginUser({ phone: normalized, password });
      return res.status(result.status).json(result.body);
    }

    const { data: user, error: selErr } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalized)
      .maybeSingle();

    if (selErr) {
      console.error('[login] select error:', selErr);
      return res.status(500).json({ error: 'Gagal login' });
    }

    // Generic message to avoid leaking whether the phone is registered
    if (!user || !user.verified) {
      return res.status(401).json({ error: 'Nomor atau password salah' });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Nomor atau password salah' });
    }

    const safeUser = sanitizeUser(user);
    const token = signToken({ sub: user.id, phone: user.phone });
    await supabase.from('sessions').insert({
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    });

    return res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Gagal login' });
  }
}

// ─── Forgot password: send OTP ───────────────────────────────────────────────

export async function sendForgotPasswordOTP(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Nomor WhatsApp harus diisi' });
    }
    const normalized = cleanPhone(phone);
    if (!validatePhone(normalized)) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid' });
    }

    if (useDevAuth()) {
      const result = devForgotPassword({ phone: normalized });
      return res.status(result.status).json(result.body);
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, verified')
      .eq('phone', normalized)
      .maybeSingle();

    // Don't reveal whether the phone is registered
    if (!user || !user.verified) {
      return res.json({ message: 'Jika nomor terdaftar, OTP akan dikirim.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    await supabase.from('otps').insert({
      phone: normalized,
      otp,
      purpose: 'forgot-password',
      expires_at: expiresAt,
      used: false,
    });

    // TODO: Send OTP via WhatsApp API
    if (shouldShowDevOtp()) {
      console.log(`[OTP][forgot-password] Phone: ${normalized}, Code: ${otp}`);
    }

    return res.json({
      message: 'Jika nomor terdaftar, OTP akan dikirim.',
      ...(shouldShowDevOtp() && { otp }),
    });
  } catch (error) {
    console.error('Forgot password OTP error:', error);
    return res.status(500).json({ error: 'Gagal mengirim OTP' });
  }
}

// ─── Forgot password: verify OTP → get reset token ──────────────────────────

export async function verifyForgotPasswordOTP(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Nomor dan OTP harus diisi' });
    }
    const normalized = cleanPhone(phone);

    if (useDevAuth()) {
      const result = devVerifyForgotPasswordOtp({ phone: normalized, otp });
      return res.status(result.status).json(result.body);
    }

    const { data: otpRow } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', normalized)
      .eq('purpose', 'forgot-password')
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return res.status(400).json({ error: 'OTP tidak ditemukan, silakan minta ulang' });
    }
    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'OTP sudah expired, silakan minta ulang' });
    }
    if (otpRow.otp !== otp) {
      return res.status(400).json({ error: 'OTP salah, silakan coba lagi' });
    }

    await supabase.from('otps').update({ used: true }).eq('id', otpRow.id);

    const resetToken = generateResetToken();
    const { error: rtErr } = await supabase.from('reset_tokens').insert({
      phone: normalized,
      token: resetToken,
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
      used: false,
    });
    if (rtErr) {
      console.error('[verifyForgotPasswordOTP] reset insert error:', rtErr);
      return res.status(500).json({ error: 'Gagal verifikasi OTP' });
    }

    return res.json({ resetToken });
  } catch (error) {
    console.error('Verify forgot password OTP error:', error);
    return res.status(500).json({ error: 'Gagal verifikasi OTP' });
  }
}

// ─── Reset password ─────────────────────────────────────────────────────────

export async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token dan password baru harus diisi' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter' });
    }

    if (useDevAuth()) {
      const result = await devResetPassword({ resetToken, newPassword });
      return res.status(result.status).json(result.body);
    }

    const { data: rt } = await supabase
      .from('reset_tokens')
      .select('*')
      .eq('token', resetToken)
      .eq('used', false)
      .maybeSingle();

    if (!rt) {
      return res.status(400).json({ error: 'Reset token tidak valid atau sudah digunakan' });
    }
    if (new Date(rt.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Reset token sudah expired, silakan ulangi proses' });
    }

    const passwordHash = await hashPassword(newPassword);
    const { error: updErr } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('phone', rt.phone);
    if (updErr) {
      console.error('[resetPassword] update error:', updErr);
      return res.status(500).json({ error: 'Gagal mengubah password' });
    }

    await supabase.from('reset_tokens').update({ used: true }).eq('id', rt.id);

    return res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Gagal mengubah password' });
  }
}

// ─── Logout ─────────────────────────────────────────────────────────────────

export async function logout(req, res) {
  try {
    const { token } = req.body;
    if (useDevAuth()) {
      const result = devLogout(token);
      return res.status(result.status).json(result.body);
    }

    if (token) {
      await supabase.from('sessions').delete().eq('token', token);
    }
    return res.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Gagal logout' });
  }
}

// ─── Auth middleware ─────────────────────────────────────────────────────────
// Verifies JWT signature, then ensures the session row still exists
// (so revoked tokens stop working immediately on logout).

export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    const decoded = verifyJwt(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah expired' });
    }

    if (useDevAuth()) {
      const user = devVerifyToken(token);
      if (!user) return res.status(401).json({ error: 'Token tidak valid atau sudah expired' });
      req.user = user;
      return next();
    }

    const { data: session } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (!session || new Date(session.expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah expired' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    console.error('verifyToken error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
