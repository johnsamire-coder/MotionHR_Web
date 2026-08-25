import { NextResponse } from 'next/server';

const DJANGO_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jssolutions-eg.com';

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = req.headers.get('authorization') || '';
  const body = await req.text();
  try {
    const res = await fetch(`${DJANGO_URL}/attendance/api/mobile/manager/shifts/${id}/update/`, {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { detail: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = req.headers.get('authorization') || '';
  try {
    const res = await fetch(`${DJANGO_URL}/attendance/api/mobile/manager/shifts/${id}/delete/`, {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { detail: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
