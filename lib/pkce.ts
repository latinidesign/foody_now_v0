// lib/pkce.ts
import crypto from 'crypto';

export function generateCodeVerifier(): string {
  return crypto
    .randomBytes(64)
    .toString('base64url')
    .slice(0, 128);
}

export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}
