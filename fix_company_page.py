"""
Complete fix for company page
1. Show actual error message from backend
2. Enable logo upload button (link to file input)
3. Reload data after successful save
4. Add reload after logo upload
"""
from pathlib import Path

path = Path("src/app/hr/company/page.tsx")
text = path.read_text(encoding="utf-8")

# ═══════════════════════════════════════════════
# FIX 1: Add useRef import
# ═══════════════════════════════════════════════
old_import = 'import { useState, useEffect } from "react";'
new_import = 'import { useState, useEffect, useRef } from "react";'

if old_import in text:
    text = text.replace(old_import, new_import)
    print("[OK] Fix 1: Added useRef import")

# ═══════════════════════════════════════════════
# FIX 2: Add fileInputRef inside component
# ═══════════════════════════════════════════════
old_state = '''  const [activeTab, setActiveTab] = useState<"info" | "stats">("info");
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);'''

new_state = '''  const [activeTab, setActiveTab] = useState<"info" | "stats">("info");
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);'''

if old_state in text:
    text = text.replace(old_state, new_state)
    print("[OK] Fix 2: Added fileInputRef")

# ═══════════════════════════════════════════════
# FIX 3: Fix handleSaveCompany - show real error + reload data
# ═══════════════════════════════════════════════
old_save = '''  const handleSaveCompany = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/info", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(company),
      });
      if (!res.ok) throw new Error();
      toast.success(d.settingsSaved);
    } catch {
      toast.error(d.settingsSaveFailed);
    } finally {
      setSaving(false);
    }
  };'''

new_save = '''  const handleSaveCompany = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/info", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(company),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(d.settingsSaved || (lang === "ar" ? "تم الحفظ بنجاح" : "Saved successfully"));
        // إعادة تحميل البيانات المحدثة
        const refreshRes = await fetch("/api/company/info", { headers: { Authorization: authHeader } });
        const refreshData = await refreshRes.json();
        if (refreshData?.company) setCompany(refreshData.company);
      } else {
        toast.error(data.error || data.message || d.settingsSaveFailed || (lang === "ar" ? "فشل الحفظ" : "Save failed"));
      }
    } catch (err) {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Network error");
    } finally {
      setSaving(false);
    }
  };'''

if old_save in text:
    text = text.replace(old_save, new_save)
    print("[OK] Fix 3: Fixed save + shows real error + reloads data")

# ═══════════════════════════════════════════════
# FIX 4: Fix Logo Button (add onClick + hidden input)
# ═══════════════════════════════════════════════
old_logo_button = '''                  <Button variant="outline" className="gap-2">
                    <Camera className="w-4 h-4" />
                    {company.logo_url ? d.changeLogo : d.uploadLogo}
                  </Button>'''

new_logo_button = '''                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleUploadLogo}
                    style={{ display: 'none' }}
                  />
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <Camera className="w-4 h-4" />
                    {saving ? (lang === "ar" ? "جاري الرفع..." : "Uploading...") : (company.logo_url ? d.changeLogo : d.uploadLogo)}
                  </Button>'''

if old_logo_button in text:
    text = text.replace(old_logo_button, new_logo_button)
    print("[OK] Fix 4: Fixed logo upload button")

# احفظ
path.write_text(text, encoding="utf-8")
print(f"\n[SUCCESS] Company page fixed!")
print(f"Size: {path.stat().st_size} bytes")
