"""
Fix shifts API route + page - add PUT and DELETE support
"""
from pathlib import Path

# ═══════════════════════════════════════════════
# FIX 1: Update API Route to support PUT and DELETE
# ═══════════════════════════════════════════════
route_path = Path("src/app/api/shifts/route.ts")
route_content = '''import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://jssolutions-eg.com/attendance/api/mobile/manager/shifts";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const response = await fetch(`${BACKEND_BASE}/`, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `فشل تحميل الشيفتات (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Shifts GET error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في الاتصال بالسيرفر" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const response = await fetch(`${BACKEND_BASE}/create/`, {
      method: "POST",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shifts POST error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في إنشاء الشيفت" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("id");

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: "Shift ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_BASE}/${shiftId}/update/`, {
      method: "PUT",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shifts PUT error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في تحديث الشيفت" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("id");

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: "Shift ID required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_BASE}/${shiftId}/delete/`, {
      method: "DELETE",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shifts DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في حذف الشيفت" },
      { status: 500 }
    );
  }
}
'''

route_path.write_text(route_content, encoding="utf-8")
print(f"[OK] API Route: Added PUT + DELETE support")
print(f"     Size: {route_path.stat().st_size} bytes")

# ═══════════════════════════════════════════════
# FIX 2: Now apply the shifts page fixes
# ═══════════════════════════════════════════════
page_path = Path("src/app/hr/shifts/page.tsx")
text = page_path.read_text(encoding="utf-8")

# Add new state variables
old_state = '''  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({'''

new_state = '''  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({'''

if old_state in text:
    text = text.replace(old_state, new_state)
    print("[OK] Page: Added state variables")

# Add handlers
old_handle_save = '''  const handleSave = async () => {'''
new_handlers = '''  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name || "",
      shift_type: shift.shift_type || "fixed",
      start_time: shift.start_time || "09:00",
      end_time: shift.end_time || "17:00",
      required_daily_hours: shift.required_daily_hours || 8,
      grace_period: shift.grace_period || 15,
      break_duration: shift.break_duration || 60,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteShiftId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/shifts?id=${deleteShiftId}`, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success(lang === "ar" ? "تم حذف الشيفت" : "Shift deleted");
      setDeleteShiftId(null);
      loadShifts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err?.response?.data?.error || err?.response?.data?.message || (lang === "ar" ? "فشل الحذف" : "Delete failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {'''

if old_handle_save in text:
    text = text.replace(old_handle_save, new_handlers, 1)
    print("[OK] Page: Added openEditDialog + handleDelete")

# Update handleSave for edit
old_save_body = '''    if (!formData.name.trim()) { toast.error(d.shiftNameRequired); return; }
    setIsSaving(true);
    try {
      await axios.post("/api/shifts", formData, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success(d.createdShiftSuccess);
      setDialogOpen(false);
      loadShifts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || d.failedCreateShift);
    } finally {
      setIsSaving(false);
    }
  };'''

new_save_body = '''    if (!formData.name.trim()) { toast.error(d.shiftNameRequired); return; }
    setIsSaving(true);
    try {
      if (editingShift) {
        await axios.put(`/api/shifts?id=${editingShift.id}`, formData, {
          headers: { Authorization: `Token ${token}` },
        });
        toast.success(lang === "ar" ? "تم تعديل الشيفت" : "Shift updated");
      } else {
        await axios.post("/api/shifts", formData, {
          headers: { Authorization: `Token ${token}` },
        });
        toast.success(d.createdShiftSuccess);
      }
      setDialogOpen(false);
      setEditingShift(null);
      loadShifts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err?.response?.data?.error || err?.response?.data?.message || d.failedCreateShift);
    } finally {
      setIsSaving(false);
    }
  };'''

if old_save_body in text:
    text = text.replace(old_save_body, new_save_body)
    print("[OK] Page: Updated handleSave for edit mode")

# Clear editingShift in openCreateDialog
old_open_create = '''  const openCreateDialog = () => {
    setFormData({
      name: "", shift_type: "fixed",
      start_time: "09:00", end_time: "17:00",
      required_daily_hours: 8, grace_period: 15, break_duration: 60,
    });
    setDialogOpen(true);
  };'''

new_open_create = '''  const openCreateDialog = () => {
    setEditingShift(null);
    setFormData({
      name: "", shift_type: "fixed",
      start_time: "09:00", end_time: "17:00",
      required_daily_hours: 8, grace_period: 15, break_duration: 60,
    });
    setDialogOpen(true);
  };'''

if old_open_create in text:
    text = text.replace(old_open_create, new_open_create)
    print("[OK] Page: Updated openCreateDialog")

# Add onClick handlers to menu items
old_edit_item = '''                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 ml-2" />{d.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 ml-2" />{d.assignEmployees}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 ml-2" />{d.delete}
                        </DropdownMenuItem>'''

new_edit_item = '''                        <DropdownMenuItem onClick={() => openEditDialog(shift)}>
                          <Edit className="w-4 h-4 ml-2" />{d.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(lang === "ar" ? "قريباً" : "Coming soon")}>
                          <Users className="w-4 h-4 ml-2" />{d.assignEmployees}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteShiftId(shift.id)}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />{d.delete}
                        </DropdownMenuItem>'''

if old_edit_item in text:
    text = text.replace(old_edit_item, new_edit_item)
    print("[OK] Page: Added onClick handlers")

# Update dialog title
old_dialog_title = '''            <DialogTitle>{d.addShift}</DialogTitle>
            <DialogDescription>{d.shiftsDesc}</DialogDescription>'''

new_dialog_title = '''            <DialogTitle>{editingShift ? (lang === "ar" ? "تعديل الشيفت" : "Edit Shift") : d.addShift}</DialogTitle>
            <DialogDescription>{d.shiftsDesc}</DialogDescription>'''

if old_dialog_title in text:
    text = text.replace(old_dialog_title, new_dialog_title)
    print("[OK] Page: Updated dialog title")

# Update save button + add delete dialog
old_save_btn = '''            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
                : <><Plus className="w-4 h-4" />{d.addShift}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>'''

new_save_btn = '''            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
                : editingShift
                  ? <>{lang === "ar" ? "حفظ التعديلات" : "Save Changes"}</>
                  : <><Plus className="w-4 h-4" />{d.addShift}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteShiftId} onOpenChange={(open) => !open && setDeleteShiftId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {lang === "ar" 
                ? "هل أنت متأكد من حذف هذا الشيفت؟ لن يمكن التراجع." 
                : "Are you sure you want to delete this shift? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteShiftId(null)} disabled={isDeleting}>
              {d.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
              {isDeleting 
                ? <><Loader2 className="w-4 h-4 animate-spin" />{lang === "ar" ? "جاري الحذف..." : "Deleting..."}</>
                : <><Trash2 className="w-4 h-4" />{d.delete}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>'''

if old_save_btn in text:
    text = text.replace(old_save_btn, new_save_btn)
    print("[OK] Page: Added delete dialog + updated save button")

page_path.write_text(text, encoding="utf-8")
print(f"\n[SUCCESS] All fixes applied!")
print(f"Page size: {page_path.stat().st_size} bytes")
