from django.utils import timezone
from django.core.cache import cache
from django.db import connection
import calendar, datetime, re

# 1) تنظيف مسيرات تجريبية خاطئة (سبتمبر المستقبلي + أي مسيرات فارغة)
with connection.cursor() as c:
    c.execute("DELETE FROM attendance_payrollline WHERE payroll_run_id IN (SELECT id FROM attendance_payrollrun WHERE company_id=61);")
    c.execute("DELETE FROM attendance_payrollrun WHERE company_id=61;")
print("✅ Cleaned all GPR payroll runs/lines")

# 2) قراءة دالة الإنشاء وتعديلها
path = "/var/www/motionhr/attendance/api_payroll.py"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# تأكد من وجود datetime/calendar imports في أعلى الملف أو داخل الدالة
marker = "def payroll_run_create(request):"
if marker not in src:
    raise SystemExit("payroll_run_create not found")

# نحقن قواعد التحقق بعد استخراج year, month داخل payroll_run_create
# نبحث عن أول استخدام لـ year, month داخل الدالة بعد التعريف
fn_start = src.find(marker)
fn_next = src.find("\ndef ", fn_start + 1)
fn_body = src[fn_start:fn_next if fn_next != -1 else len(src)]

rule_block = '''
    # ===== قواعد محاسبية صارمة لتشغيل المسير =====
    import datetime, calendar
    from django.utils import timezone
    from companies.models import Company

    today = timezone.localdate()
    current_month_start = datetime.date(today.year, today.month, 1)
    requested_month_start = datetime.date(year, month, 1)

    # 1) ممنوع شهر مستقبلي
    if requested_month_start > current_month_start:
        return Response({
            "success": False,
            "error": f"لا يمكن تشغيل مسير رواتب لشهر مستقبلي ({year}-{month:02d}). الشهر الحالي هو {today.year}-{today.month:02d}."
        }, status=400)

    # 2) ممنوع قبل تاريخ بدء تشغيل الشركة (Super Admin control)
    company_obj = Company.objects.filter(id=getattr(company, "id", None) or company_id).first() if "company" in locals() else None
    if company_obj is None:
        try:
            company_obj = Company.objects.filter(id=company_id).first()
        except Exception:
            company_obj = None
    if company_obj and getattr(company_obj, "system_start_date", None):
        go_live_month = datetime.date(company_obj.system_start_date.year, company_obj.system_start_date.month, 1)
        if requested_month_start < go_live_month:
            return Response({
                "success": False,
                "error": f"لا يمكن تشغيل مسير قبل تاريخ بدء تشغيل الشركة ({company_obj.system_start_date})."
            }, status=400)
    # ===== نهاية القواعد =====
'''

if "ممنوع شهر مستقبلي" in fn_body:
    print("ALREADY_PATCHED: future-month rules exist")
else:
    # نحقن بعد سطر year, month = ... داخل الدالة
    m = re.search(r"(def payroll_run_create\(request\):[\s\S]*?)(\n\s*year,\s*month\s*=\s*[^\n]+\n)", src)
    if not m:
        # بديل: بعد notes = 
        m = re.search(r"(def payroll_run_create\(request\):[\s\S]*?)(\n\s*notes\s*=\s*[^\n]+\n)", src)
    if not m:
        raise SystemExit("Could not find injection point in payroll_run_create")

    inject_at = m.end(2)
    src = src[:inject_at] + rule_block + src[inject_at:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(src)
    print("✅ PATCHED payroll_run_create with future/go-live rules")

# 3) مسح الكاش
cache.clear()
print("✅ Cache cleared")
print("Today:", timezone.localdate())
