// Rate limiter sederhana (in-memory) untuk endpoint login admin.
//
// Catatan: store ini hidup di memory container. Cocok untuk deployment
// single-container (seperti proyek ini). Jika nanti di-scale ke banyak
// instance, ganti dengan store bersama (Redis/Upstash).
type Entry = {
  failed: number;
  windowStart: number;
  lockUntil: number;
};

const store = new Map<string, Entry>();

const MAX_FAILED = 5; // 5x gagal berturut-turut dalam window
const WINDOW_MS = 15 * 60 * 1000; // window 15 menit
const LOCK_MS = 15 * 60 * 1000; // lockout 15 menit setelah melewati batas

// Ambil IP klien. nginx (nextcloud_nginx) selalu set X-Real-IP dari
// $remote_addr, jadi nilai ini tidak bisa di-spoof klien.
export function getClientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

export function checkLoginRateLimit(
  ip: string
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = store.get(ip);
  if (entry && entry.lockUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.lockUntil - now) / 1000),
    };
  }
  return { allowed: true };
}

export function recordFailedLogin(ip: string) {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || now > entry.windowStart + WINDOW_MS) {
    store.set(ip, { failed: 1, windowStart: now, lockUntil: 0 });
    return;
  }
  entry.failed += 1;
  if (entry.failed >= MAX_FAILED) {
    entry.lockUntil = now + LOCK_MS;
  }
}

export function clearLoginAttempts(ip: string) {
  store.delete(ip);
}

// Bersihkan entri basi agar map tidak membengkak (berjalan tiap 5 menit).
const sweep = () => {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (now > entry.windowStart + WINDOW_MS && entry.lockUntil <= now) {
      store.delete(ip);
    }
  }
};
if (typeof setInterval === "function") {
  setInterval(sweep, 5 * 60 * 1000).unref?.();
}
