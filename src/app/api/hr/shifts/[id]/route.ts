import { NextResponse } from 'next/server';

const DJANGO_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jssolutions-eg.com';

async function proxy(req: Request, ctx: { params: Promise<{ id: string }> }, method: string) {
  const { id } = await ctx.params;
  const auth = req.headers.get('authorization') || '';
  const body = (method !== 'GET' && method !== 'DELETE') ? await req.text() : undefined;
  try {
    const res = await fetch(`${DJANGO_URL}/attendance/api/mobile/manager/shifts/${id}/`, {
      method,
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: body || undefined,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend fetch failed' }, { status: 500 });
  }
}

export async function GET(req: Request, ctx: any) { return proxy(req, ctx, 'GET'); }
export async function PUT(req: Request, ctx: any) { return proxy(req, ctx, 'PUT'); }
export async function DELETE(req: Request, ctx: any) { return proxy(req, ctx, 'DELETE'); }
