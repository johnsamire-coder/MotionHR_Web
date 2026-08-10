"""
Add back button + header to shifts exceptions and rotations pages
"""
from pathlib import Path

# ═══════════════════════════════════════════════
# FIX 1: Shift Exceptions Page
# ═══════════════════════════════════════════════
exc_path = Path("src/app/hr/shifts/exceptions/page.tsx")
exc_text = exc_path.read_text(encoding="utf-8")

# 1) Add imports
old_imports1 = '''"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";'''

new_imports1 = '''"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";'''

if old_imports1 in exc_text:
    exc_text = exc_text.replace(old_imports1, new_imports1)
    print("[OK] Exceptions: Added imports")

# 2) Add header after ShiftExceptionsPage() function opening
# نبحث عن الـ return الأول ونضيف قبله header
# لكن أسهل نضيفه في بداية الـ JSX

# نبحث عن أول return ( في الـ component
import re

# نضيف header قبل أول <div>
# نلاقي "return (" ونشوف الـ JSX بعده
old_return_pattern = re.compile(r'(return\s*\(\s*)(<div)', re.DOTALL)

def add_header_exc(match):
    return_kw = match.group(1)
    div_start = match.group(2)
    header_jsx = '''<div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/hr/shifts">
            <Button variant="outline" size="sm" className="gap-2">
              {ar ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {ar ? "رجوع للشيفتات" : "Back to Shifts"}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {ar ? "استثناءات الشيفتات" : "Shift Exceptions"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ar ? "تغيير شيفت موظف ليوم واحد فقط" : "Change employee shift for a single day"}
            </p>
          </div>
        </div>
      </div>

      '''
    return return_kw + header_jsx + div_start

new_text = old_return_pattern.sub(add_header_exc, exc_text, count=1)
if new_text != exc_text:
    exc_text = new_text
    print("[OK] Exceptions: Added header with back button")
else:
    print("[WARN] Exceptions: Could not add header")

# 3) Close the wrapper div at the end
# نبحث عن آخر </div>) في الملف
last_closing = exc_text.rfind("</div>\n  );")
if last_closing > 0:
    exc_text = exc_text[:last_closing] + "</div>\n    </div>\n  );" + exc_text[last_closing + len("</div>\n  );"):]
    print("[OK] Exceptions: Closed wrapper div")

exc_path.write_text(exc_text, encoding="utf-8")
print(f"[OK] Exceptions file saved: {exc_path.stat().st_size} bytes")

# ═══════════════════════════════════════════════
# FIX 2: Shift Rotations Page
# ═══════════════════════════════════════════════
rot_path = Path("src/app/hr/shifts/rotations/page.tsx")
rot_text = rot_path.read_text(encoding="utf-8")

# 1) Add imports
old_imports2 = '''"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RotateCcw, Plus, Trash2, Loader2, Users, Building2, Layers } from "lucide-react";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";'''

new_imports2 = '''"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RotateCcw, Plus, Trash2, Loader2, Users, Building2, Layers, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";'''

if old_imports2 in rot_text:
    rot_text = rot_text.replace(old_imports2, new_imports2)
    print("[OK] Rotations: Added imports")

# 2) Add header (same approach)
def add_header_rot(match):
    return_kw = match.group(1)
    div_start = match.group(2)
    header_jsx = '''<div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/hr/shifts">
            <Button variant="outline" size="sm" className="gap-2">
              {ar ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {ar ? "رجوع للشيفتات" : "Back to Shifts"}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {ar ? "تناوب الشيفتات" : "Shift Rotations"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ar ? "دورات تلقائية لتبديل الشيفتات" : "Automatic shift rotation cycles"}
            </p>
          </div>
        </div>
      </div>

      '''
    return return_kw + header_jsx + div_start

new_rot_text = old_return_pattern.sub(add_header_rot, rot_text, count=1)
if new_rot_text != rot_text:
    rot_text = new_rot_text
    print("[OK] Rotations: Added header with back button")

# 3) Close wrapper div
last_closing2 = rot_text.rfind("</div>\n  );")
if last_closing2 > 0:
    rot_text = rot_text[:last_closing2] + "</div>\n    </div>\n  );" + rot_text[last_closing2 + len("</div>\n  );"):]
    print("[OK] Rotations: Closed wrapper div")

rot_path.write_text(rot_text, encoding="utf-8")
print(f"[OK] Rotations file saved: {rot_path.stat().st_size} bytes")

print("\n[SUCCESS] Both pages have back buttons now!")
