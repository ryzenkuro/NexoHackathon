import '../config/env.js';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET || SECRET.length < 32) {
  // Fail loudly during startup so a missing/weak secret does not silently
  // sign all tokens with the same string. JWT_SECRET should be 32+ chars.
  throw new Error(
    '[jwt] JWT_SECRET is missing or shorter than 32 chars. ' +
    'Set a strong value in app/.env before starting the server.'
  );
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
