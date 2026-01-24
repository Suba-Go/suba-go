import * as crypto from 'crypto';

/**
 * Parse durations like "7d", "12h", "30m", "900s".
 * If value is a plain number (e.g. "604800"), it's treated as seconds.
 */
export function parseDurationToMs(value: string): number {
  const v = (value ?? '').trim();
  if (!v) return 0;

  // Pure number -> seconds
  if (/^\d+$/.test(v)) {
    return Number(v) * 1000;
  }

  const match = v.match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) {
    throw new Error(
      `Invalid duration "${value}". Expected formats like 900s, 30m, 12h, 7d`
    );
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

export function computeExpiryDate(duration: string): Date {
  const ms = parseDurationToMs(duration);
  return new Date(Date.now() + ms);
}

/**
 * One-way token hash (HMAC-SHA256) so we never store raw refresh tokens.
 */
export function hashToken(token: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}
