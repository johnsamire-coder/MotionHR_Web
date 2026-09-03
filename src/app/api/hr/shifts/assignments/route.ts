import { NextRequest, NextResponse } from 'next/server';

const DJANGO_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jssolutions-eg.com';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  try {
    const res = await fetch(`${DJANGO_URL}/attendance/api/mobile/manager/shifts/assignments/`, {
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = []; }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'assignment_id is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${DJANGO_URL}/attendance/api/mobile/manager/shifts/assignments/${id}/delete/`, {
      method: 'DELETE',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete assignment' }, { status: 500 });
  }
}
