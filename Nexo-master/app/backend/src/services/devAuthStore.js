import bcrypt from 'bcryptjs';
import { signToken, verifyJwt } from '../lib/jwt.js';

const users = new Map();
const otps = [];
const resetTokens = new Map();
const sessions = new Map();

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    businessCategory: user.businessCategory ?? 'Umum',
  };
}

function cleanPhone(phone) {
  return String(phone || '').replace(/\s/g, '');
}

export async function devRegisterUser({ phone, name, password }) {
  const normalized = cleanPhone(phone);
  const existing = users.get(normalized);
  if (existing?.verified) {
    return { status: 409, body: { error: 'Nomor ini sudah terdaftar. Silakan login.' } };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  users.set(normalized, {
    id: existing?.id ?? makeId('dev_user'),
    name: String(name || '').trim(),
    phone: normalized,
    passwordHash,
    verified: false,
    businessCategory: 'Umum',
  });

  return { status: 200, body: { message: 'Registrasi dev berhasil. Silakan verifikasi OTP.' } };
}

export function devSendOtp({ phone, purpose = 'register' }) {
  const normalized = cleanPhone(phone);
  const otp = '123456';
  otps.push({
    id: makeId('dev_otp'),
    phone: normalized,
    otp,
    purpose,
    used: false,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  return {
    status: 200,
    body: {
      message: 'OTP dev terkirim',
      otp,
    },
  };
}

export function devVerifyRegisterOtp({ phone, otp }) {
  const normalized = cleanPhone(phone);
  const otpRow = [...otps]
    .reverse()
    .find((item) => item.phone === normalized && item.purpose === 'register' && !item.used);

  if (!otpRow) return { status: 400, body: { error: 'OTP tidak ditemukan, silakan minta ulang' } };
  if (otpRow.expiresAt < Date.now()) return { status: 400, body: { error: 'OTP sudah expired, silakan minta ulang' } };
  if (otpRow.otp !== otp) return { status: 400, body: { error: 'OTP salah, silakan coba lagi' } };

  const user = users.get(normalized);
  if (!user) return { status: 400, body: { error: 'Data registrasi tidak ditemukan, silakan daftar ulang' } };

  otpRow.used = true;
  user.verified = true;

  const token = signToken({ sub: user.id, phone: user.phone });
  sessions.set(token, {
    userId: user.id,
    phone: user.phone,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return { status: 200, body: { token, user: sanitizeUser(user) } };
}

export async function devLoginUser({ phone, password }) {
  const normalized = cleanPhone(phone);
  const user = users.get(normalized);
  if (!user || !user.verified) {
    return { status: 401, body: { error: 'Nomor atau password salah' } };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { status: 401, body: { error: 'Nomor atau password salah' } };

  const token = signToken({ sub: user.id, phone: user.phone });
  sessions.set(token, {
    userId: user.id,
    phone: user.phone,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return { status: 200, body: { token, user: sanitizeUser(user) } };
}

export function devForgotPassword({ phone }) {
  return devSendOtp({ phone, purpose: 'forgot-password' });
}

export function devVerifyForgotPasswordOtp({ phone, otp }) {
  const normalized = cleanPhone(phone);
  const otpRow = [...otps]
    .reverse()
    .find((item) => item.phone === normalized && item.purpose === 'forgot-password' && !item.used);

  if (!otpRow) return { status: 400, body: { error: 'OTP tidak ditemukan, silakan minta ulang' } };
  if (otpRow.expiresAt < Date.now()) return { status: 400, body: { error: 'OTP sudah expired, silakan minta ulang' } };
  if (otpRow.otp !== otp) return { status: 400, body: { error: 'OTP salah, silakan coba lagi' } };

  otpRow.used = true;
  const resetToken = makeId('dev_reset');
  resetTokens.set(resetToken, {
    phone: normalized,
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    used: false,
  });

  return { status: 200, body: { resetToken } };
}

export async function devResetPassword({ resetToken, newPassword }) {
  const row = resetTokens.get(resetToken);
  if (!row || row.used || row.expiresAt < Date.now()) {
    return { status: 400, body: { error: 'Reset token tidak valid atau sudah digunakan' } };
  }

  const user = users.get(row.phone);
  if (user) user.passwordHash = await bcrypt.hash(newPassword, 12);
  row.used = true;
  return { status: 200, body: { message: 'Password berhasil diubah' } };
}

export function devLogout(token) {
  if (token) sessions.delete(token);
  return { status: 200, body: { message: 'Logout berhasil' } };
}

export function devVerifyToken(token) {
  const decoded = verifyJwt(token);
  const session = decoded ? sessions.get(token) : null;
  if (!decoded || !session || session.expiresAt < Date.now()) return null;

  const user = [...users.values()].find((item) => item.id === session.userId);
  return user ? sanitizeUser(user) : null;
}
