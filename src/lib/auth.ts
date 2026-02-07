import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function signToken(payload: {
  userId: string;
  email: string;
}): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
}> {
  const verified = await jwtVerify(token, JWT_SECRET);
  return verified.payload as { userId: string; email: string };
}

export async function getAuthUser(
  request: Request
): Promise<{ userId: string; email: string }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  return verifyToken(token);
}

// === Guest Authentication (Social Tasting Mode) ===

export async function signGuestToken(payload: {
  guestId: string;
  sessionCode: string;
  guestName: string;
}): Promise<string> {
  const token = await new SignJWT({ ...payload, type: 'guest' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyGuestToken(token: string): Promise<{
  guestId: string;
  sessionCode: string;
  guestName: string;
}> {
  const verified = await jwtVerify(token, JWT_SECRET);
  const payload = verified.payload as {
    guestId: string;
    sessionCode: string;
    guestName: string;
    type: string;
  };

  if (payload.type !== 'guest') {
    throw new Error('Invalid guest token');
  }

  return {
    guestId: payload.guestId,
    sessionCode: payload.sessionCode,
    guestName: payload.guestName,
  };
}

export async function getAuthGuest(
  request: Request
): Promise<{ guestId: string; sessionCode: string; guestName: string }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  return verifyGuestToken(token);
}

// Hash a guest token for storage (simple hash, not bcrypt — just for revocation check)
export function hashGuestToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}
