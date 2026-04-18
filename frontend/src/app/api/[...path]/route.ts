import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function proxy(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  const search = req.nextUrl.search;
  const target = `${API_URL}${path}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      duplex: "half",
      cache: "no-store",
    } as RequestInit);

    return new NextResponse(res.body, {
      status: res.status,
      headers: res.headers,
    });
  } catch {
    return NextResponse.json({ error: `API unavailable: ${API_URL}` }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
