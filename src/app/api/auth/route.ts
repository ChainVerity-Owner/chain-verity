import { NextRequest, NextResponse } from "next/server";

const PASSWORD = process.env.DEMO_PASSWORD || "chainverity1867";
const COOKIE   = "cv_auth";
const MAX_AGE  = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  const { password, from } = await req.json();

  if (password !== PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const redirect = from && from !== "/" ? from : "/";
  const res = NextResponse.json({ ok: true, redirect });

  res.cookies.set(COOKIE, PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return res;
}
