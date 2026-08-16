import { NextResponse } from "next/server";
import { checkAdminPassword, getSession } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const password = body?.password;
  if (!password || !checkAdminPassword(password)) {
    return NextResponse.json({ error: "Kata sandi salah" }, { status: 401 });
  }

  const session = await getSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
