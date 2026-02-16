/**
 * A tiny single-flight / cooldown helper to avoid parallel NextAuth "update()"
 * calls from multiple components.
 *
 * Why: Next.js renders can trigger several concurrent requests that all try
 * to refresh tokens at the same time. If the backend rotates refresh tokens,
 * that can lead to intermittent logouts. Even without rotation, this avoids
 * unnecessary traffic and flicker.
 */

type UpdateFn = () => Promise<unknown>;

let inflight: Promise<void> | null = null;
let lastRunAt = 0;

export async function ensureSessionFresh(update: UpdateFn, cooldownMs = 5000) {
  const now = Date.now();
  if (now - lastRunAt < cooldownMs) return;

  if (!inflight) {
    inflight = (async () => {
      try {
        await update();
      } finally {
        lastRunAt = Date.now();
        inflight = null;
      }
    })();
  }

  await inflight;
}
