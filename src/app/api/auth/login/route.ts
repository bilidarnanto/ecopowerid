import { NextResponse } from "next/server";
import { checkAdminPassword, getSession } from "@/lib/auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  getClientIp,
  recordFailedLogin,
} from "@/lib/rate-limit";

const FAIL_DELAY_MS = 400; // memperlambat brute-force tanpa mengganggu UX

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate limit: tolak duluan jika IP sedang lockout
  const limit = checkLoginRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds ?? 900),
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const password = body?.password;
  const valid = typeof password === "string" && password.length > 0
    ? checkAdminPassword(password)
    : false;

  if (!valid) {
    recordFailedLogin(ip);
    // Delay kecil agar brute-force jauh lebih lambat (tetap <1 detik untuk user).
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return NextResponse.json({ error: "Kata sandi salah" }, { status: 401 });
  }

  clearLoginAttempts(ip);

  const session = await getSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
