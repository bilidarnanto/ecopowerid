import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual, createHash } from "crypto";

export type SessionData = {
  isAdmin: boolean;
};

const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "change-this-session-secret-min-32-chars-0000",
  cookieName: "ecopower_admin_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Timing-safe compare (anti side-channel timing attack): hash SHA-256 dulu
  // agar panjang kedua input selalu sama.
  const ha = createHash("sha256").update(password).digest();
  const hb = createHash("sha256").update(expected).digest();
  return timingSafeEqual(ha, hb);
}

/** Guard untuk halaman admin — redirect ke login jika belum login */
export async function requireAdminPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}

/** Guard untuk API admin — kembalikan false jika belum login */
export async function requireAdminApi(): Promise<boolean> {
  return isAdmin();
}
