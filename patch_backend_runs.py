import os, sys, datetime
import django

sys.path.insert(0, '/var/www/motionhr')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection
from django.core.cache import cache
from attendance.models import PayrollRun, PayrollLine
from companies.models import Company

# 1. مسح المسيرات التجريبية القديمة لبداية نظيفة
PayrollLine.objects.filter(payroll_run__company_id=61).delete()
PayrollRun.objects.filter(company_id=61).delete()
cache.clear()
print("✅ DB Cleaned: Test runs and lines deleted.")

# 2. تعديل ملف api_payroll.py لمعالجة إعادة الحساب ومنع التعارض
file_path = '/var/www/motionhr/attendance/api_payroll.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# إصلاح دالة إنشاء المسير لمسح السطور القديمة قبل الإضافة
old_create_logic = 'run, created = PayrollRun.objects.get_or_create('
new_create_logic = '''run, created = PayrollRun.objects.get_or_create(
        company_id=company_id,
        year=year,
        month=month,
        defaults={'status': 'draft', 'created_by': user, 'notes': notes}
    )
    # مسح أي سطور قديمة للمسير لمنع أخطاء Duplicate Key عند إعادة الحساب
    run.lines.all().delete()'''

if 'run.lines.all().delete()' not in content:
    # استبدال البلوك في دالة payroll_run_create
    if 'run, created = PayrollRun.objects.get_or_create(' in content:
        content = content.replace('run, created = PayrollRun.objects.get_or_create(', new_create_logic, 1)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ api_payroll.py patched: Auto-clears old lines on run creation/re-calculation!")

