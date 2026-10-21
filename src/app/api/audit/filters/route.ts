import { auditProxy } from "@/lib/audit-proxy";

export async function GET(request: Request) {
  return auditProxy(request, "/audit/api/filters/");
}
