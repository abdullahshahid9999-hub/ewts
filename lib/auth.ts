import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Access tokens are short-lived and sent in the Authorization header.
// Refresh tokens are longer-lived and belong in an httpOnly cookie —
// never localStorage (readable by any injected script).
export function signAccessToken(payload: { sub: string; role: 'agent' | 'admin' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: { sub: string; role: 'agent' | 'admin' }) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: 'agent' | 'admin' };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string; role: 'agent' | 'admin' };
  } catch {
    return null;
  }
}

// Admin allow-list check — a valid JWT alone is not enough for admin
// routes, the email must also be on this list. See admin panel brief's
// security section.
export function isAllowedAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}
