import { forwardDocuments } from "@/lib/documents-proxy";

type Ctx = { params: Promise<{ id: string; docId: string }> };
export async function PATCH(req: Request, { params }: Ctx) { const p = await params; return forwardDocuments(req, p.id, p.docId); }
export async function DELETE(req: Request, { params }: Ctx) { const p = await params; return forwardDocuments(req, p.id, p.docId); }
