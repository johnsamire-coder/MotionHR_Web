import os, sys
sys.path.insert(0, '/var/www/motionhr')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model

# 1. طباعة حقول جدول مسيرات الرواتب
with connection.cursor() as cursor:
    cursor.execute("SELECT * FROM attendance_payrollrun LIMIT 1;")
    desc = cursor.description
    fields = [col[0] for col in desc] if desc else []
    print("=== 1. PAYROLL RUN FIELDS IN DATABASE ===")
    print(fields)

# 2. فحص استجابة الـ API الحقيقية ومفاتيحها
from attendance.api_payroll import payroll_summary
import json

User = get_user_model()
u = User.objects.filter(username='gpr_admin').first()
# اختبار استدعاء قائمة المسيرات برمجياً
from rest_framework.test import APIRequestFactory
from attendance.api_payroll import payroll_summary # أو أي دالة أخرى للمسيرات

# لنجلب البيانات مباشرة من الجدول لضمان الدقة الكاملة
cursor = connection.cursor()
cursor.execute("SELECT id, year, month, status, grand_total_salary, grand_total_net, created_at FROM attendance_payrollrun WHERE company_id = 61;")
rows = cursor.fetchall()
print("\n=== 2. CURRENT RUNS IN DB FOR COMPANY 61 ===")
for r in rows:
    print(f"ID: {r[0]} | Year: {r[1]} | Month: {r[2]} | Status: {r[3]} | Total Salary: {r[4]} | Total Net: {r[5]} | Created At: {r[6]}")

