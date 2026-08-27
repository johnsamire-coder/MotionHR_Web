from django.db import connection
from django.core.cache import cache

# 1. تحديث تاريخ التشغيل في قاعدة البيانات مباشرة لشركة GPR (ID: 61)
with connection.cursor() as cursor:
    cursor.execute("UPDATE companies_company SET system_start_date = '2026-09-01' WHERE id = 61;")
    cursor.execute("SELECT id, name_ar, system_start_date FROM companies_company WHERE id = 61;")
    row = cursor.fetchone()
    print(f"✅ DB Update Verified: Company ID {row[0]} ({row[1]}) -> system_start_date: {row[2]}")

# 2. تحديث دالة payroll_summary في api_payroll.py
payroll_api_path = '/var/www/motionhr/attendance/api_payroll.py'
with open(payroll_api_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_str = '    employees = _get_company_employees(user)'
patch_str = '''    # التحقق من تاريخ بدء تشغيل النظام المحدد للشركة من قِبل Super Admin
    from companies.models import Company
    import datetime
    company_obj = Company.objects.filter(id=company_id).first()
    
    if company_obj and getattr(company_obj, 'system_start_date', None):
        start_month = datetime.date(company_obj.system_start_date.year, company_obj.system_start_date.month, 1)
        req_month = datetime.date(year, month, 1)
        
        # إذا كان الشهر المطلوب قبل تاريخ بدء تشغيل الشركة المحدد، نرجع 0
        if req_month < start_month:
            return Response({
                'year': year,
                'month': month,
                'lang': lang,
                'total_employees': 0,
                'grand_total_salary': 0.0,
                'grand_total_allowances': 0.0,
                'grand_total_overtime': 0.0,
                'grand_total_bonuses': 0.0,
                'grand_total_deductions': 0.0,
                'grand_total_net': 0.0,
                'payroll_settings': {},
                'employees': [],
                '_from_cache': False
            })

    employees = _get_company_employees(user)'''

if 'company_obj.system_start_date' not in content:
    if target_str in content:
        content = content.replace(target_str, patch_str, 1)
        with open(payroll_api_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ api_payroll.py successfully patched!")
    else:
        print("⚠️ Warning: target_str not found in api_payroll.py")
else:
    print("✅ api_payroll.py already has the system_start_date check.")

# 3. تفريغ الكاش
cache.clear()
print("✅ Redis/Django Cache Cleared.")
