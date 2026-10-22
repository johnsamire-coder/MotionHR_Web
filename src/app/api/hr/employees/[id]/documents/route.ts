import { forwardDocuments } from "@/lib/documents-proxy";

type Ctx = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Ctx) { return forwardDocuments(req, (await params).id); }
export async function POST(req: Request, { params }: Ctx) { return forwardDocuments(req, (await params).id); }
