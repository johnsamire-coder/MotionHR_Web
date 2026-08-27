import os
import django
from django.db import connection

# 1. إضافة العمود في قاعدة بيانات PostgreSQL مباشرة
with connection.cursor() as cursor:
    cursor.execute("""
        ALTER TABLE companies_company 
        ADD COLUMN IF NOT EXISTS system_start_date DATE;
    """)
print("✅ Database column 'system_start_date' created/verified.")

# 2. تحديث ملف models.py الخاص بالشركات
company_model_path = '/var/www/motionhr/companies/models.py'
with open(company_model_path, 'r', encoding='utf-8') as f:
    model_code = f.read()

if 'system_start_date' not in model_code:
    target = '    is_active = models.BooleanField('
    addition = '    system_start_date = models.DateField(null=True, blank=True, verbose_name="تاريخ بدء تشغيل النظام للشركة")\n'
    if target in model_code:
        model_code = model_code.replace(target, addition + target, 1)
        with open(company_model_path, 'w', encoding='utf-8') as f:
            f.write(model_code)
        print("✅ companies/models.py updated with system_start_date field.")

# 3. تحديد تاريخ بدء تشغيل شركة GPR (ID: 61) إلى 2026-09-01
from companies.models import Company
comp = Company.objects.filter(id=61).first()
if comp:
    comp.system_start_date = "2026-09-01"
    comp.save(update_fields=['system_start_date'])
    print(f"✅ Company '{comp.name_ar}' (ID: 61) Go-Live Date set to: {comp.system_start_date}")

# 4. تحديث دالة payroll_summary في api_payroll.py لتقرأ system_start_date
payroll_api_path = '/var/www/motionhr/attendance/api_payroll.py'
with open(payroll_api_path, 'r', encoding='utf-8') as f:
    api_code = f.read()

# سنستبدل بداية حلقة الحساب لتعتمد على تاريخ بدء تشغيل الشركة المحدد من السوبر أدمن
old_block = '    employees = _get_company_employees(user)'
new_block = '''    # التحقق من تاريخ بدء تشغيل النظام المحدد للشركة من قِبل Super Admin
    from companies.models import Company
    company_obj = Company.objects.filter(id=company_id).first()
    
    if company_obj and company_obj.system_start_date:
        import datetime
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

if 'company_obj.system_start_date' not in api_code:
    if old_block in api_code:
        api_code = api_code.replace(old_block, new_block, 1)
        with open(payroll_api_path, 'w', encoding='utf-8') as f:
            f.write(api_code)
        print("✅ api_payroll.py updated with Super Admin system_start_date control logic.")
    else:
        print("NOTE: Target block pattern already customized.")
else:
    print("ALREADY_PATCHED: api_payroll.py already has the system_start_date check.")

# 5. تفريغ كاش الرواتب
from django.core.cache import cache
cache.clear()
print("✅ Cache cleared.")
