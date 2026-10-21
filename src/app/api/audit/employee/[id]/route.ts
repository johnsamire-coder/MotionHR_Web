import { auditProxy } from "@/lib/audit-proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return auditProxy(request, `/audit/api/employee/${encodeURIComponent(id)}/`);
}
