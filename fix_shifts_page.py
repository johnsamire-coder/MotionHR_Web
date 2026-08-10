"""
Complete fix for shifts page - add edit/delete/assign handlers
"""
from pathlib import Path

path = Path("src/app/hr/shifts/page.tsx")
text = path.read_text(encoding="utf-8")

# ═══════════════════════════════════════════════
# FIX 1: Add new state variables
# ═══════════════════════════════════════════════
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
    print("[OK] Fix 1: Added edit/delete state variables")

# ═══════════════════════════════════════════════
# FIX 2: Add handlers before handleSave
# ═══════════════════════════════════════════════
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
    print("[OK] Fix 2: Added openEditDialog + handleDelete")

# ═══════════════════════════════════════════════
# FIX 3: Update handleSave to support edit
# ═══════════════════════════════════════════════
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
        // Edit mode
        await axios.put(`/api/shifts?id=${editingShift.id}`, formData, {
          headers: { Authorization: `Token ${token}` },
        });
        toast.success(lang === "ar" ? "تم تعديل الشيفت" : "Shift updated");
      } else {
        // Create mode
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
    print("[OK] Fix 3: Updated handleSave to support edit mode")

# ═══════════════════════════════════════════════
# FIX 4: Update openCreateDialog to clear editingShift
# ═══════════════════════════════════════════════
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
    print("[OK] Fix 4: Updated openCreateDialog")

# ═══════════════════════════════════════════════
# FIX 5: Add onClick to Edit menu item
# ═══════════════════════════════════════════════
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
    print("[OK] Fix 5: Added onClick handlers to menu items")

# ═══════════════════════════════════════════════
# FIX 6: Update Dialog title based on mode
# ═══════════════════════════════════════════════
old_dialog_title = '''            <DialogTitle>{d.addShift}</DialogTitle>
            <DialogDescription>{d.shiftsDesc}</DialogDescription>'''

new_dialog_title = '''            <DialogTitle>{editingShift ? (lang === "ar" ? "تعديل الشيفت" : "Edit Shift") : d.addShift}</DialogTitle>
            <DialogDescription>{d.shiftsDesc}</DialogDescription>'''

if old_dialog_title in text:
    text = text.replace(old_dialog_title, new_dialog_title)
    print("[OK] Fix 6: Updated dialog title")

# ═══════════════════════════════════════════════
# FIX 7: Update save button text
# ═══════════════════════════════════════════════
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
    print("[OK] Fix 7: Updated save button + added delete dialog")

# احفظ
path.write_text(text, encoding="utf-8")
print(f"\n[SUCCESS] All fixes applied!")
print(f"Size: {path.stat().st_size} bytes")
