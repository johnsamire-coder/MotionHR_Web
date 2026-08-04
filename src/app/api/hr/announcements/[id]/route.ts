import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/announcements/${params.id}/update/`,
      {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/announcements/${params.id}/delete/`,
      {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (res.status === 204) {
      return NextResponse.json({ success: true });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/announcements/${params.id}/stats/`,
      {
        headers: {
          Authorization: authHeader,
        },
        cache: "no-store",
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
