from pathlib import Path
import re

path = Path('/var/www/motionhr/attendance/api_payroll.py')
src = path.read_text(encoding='utf-8')

# Locates payroll_run_create function body until next top-level def
m = re.search(r'\ndef payroll_run_create\(request\):[\s\S]*?(?=\n\ndef |\nclass |\Z)', src)
if not m:
    raise SystemExit('payroll_run_create not found')

old_fn = m.group(0)

new_fn = r'''
def payroll_run_create(request):
    """
    تشغيل المرتبات لشهر معين
    بيحسب مرتب كل موظف ويحفظه في PayrollLine
    مع قواعد:
    - ممنوع شهر مستقبلي
    - ممنوع قبل system_start_date للشركة
    """
    user = request.user
    if not _check_manager(user):
        return Response({'success': False, 'error': 'صلاحية غير كافية'}, status=403)

    try:
        from attendance.payroll_pro_models import PayrollRun, PayrollLine
        from employees.models import Employee
        from companies.models import Company
        from django.utils import timezone
        import datetime

        company = getattr(user, 'company', None)
        if not company:
            return Response({'success': False, 'error': 'لا توجد شركة مرتبطة'}, status=400)

        data = request.data
        year = int(data.get('year', timezone.localdate().year))
        month = int(data.get('month', timezone.localdate().month))
        notes = data.get('notes', '')
        lang = data.get('lang', 'ar')

        if month < 1 or month > 12:
            return Response({'success': False, 'error': 'شهر غير صحيح'}, status=400)

        # ===== قواعد محاسبية صارمة =====
        today = timezone.localdate()
        current_month_start = datetime.date(today.year, today.month, 1)
        requested_month_start = datetime.date(year, month, 1)

        # 1) ممنوع شهر مستقبلي
        if requested_month_start > current_month_start:
            return Response({
                'success': False,
                'error': f'لا يمكن تشغيل مسير رواتب لشهر مستقبلي ({year}-{month:02d}). الشهر الحالي هو {today.year}-{today.month:02d}.'
            }, status=400)

        # 2) ممنوع قبل تاريخ بدء تشغيل الشركة (Super Admin)
        company_obj = Company.objects.filter(id=company.id).first()
        if company_obj and getattr(company_obj, 'system_start_date', None):
            go_live_month = datetime.date(
                company_obj.system_start_date.year,
                company_obj.system_start_date.month,
                1
            )
            if requested_month_start < go_live_month:
                return Response({
                    'success': False,
                    'error': f'لا يمكن تشغيل مسير قبل تاريخ بدء تشغيل الشركة ({company_obj.system_start_date}).'
                }, status=400)
        # ===== نهاية القواعد =====

        # لو فيه run موجود لنفس الشهر وحالته draft → نمسحه ونعيد الحساب
        existing = PayrollRun._base_manager.filter(
            company=company, year=year, month=month
        ).first()

        if existing and existing.status in ('approved', 'locked'):
            return Response({
                'success': False,
                'error': f'يوجد تشغيل معتمد/مقفول لهذا الشهر (ID: {existing.id}). لا يمكن إعادة التشغيل.'
            }, status=400)

        if existing:
            existing.lines.all().delete()
            run = existing
            run.notes = notes
            run.status = 'draft'
            run.save()
        else:
            run = PayrollRun._base_manager.create(
                company=company,
                year=year,
                month=month,
                status='draft',
                notes=notes,
                created_by=user,
            )

        settings = _get_payroll_settings(user)
        employees = Employee._base_manager.filter(
            company=company,
            status='active'
        ).select_related('user', 'branch', 'department', 'job_title')

        results = []
        errors = []
        grand_net = 0.0

        for emp in employees:
            try:
                payroll = calculate_effective_payroll(emp, year, month, settings, lang=lang)

                PayrollLine._base_manager.create(
                    company=company,
                    payroll_run=run,
                    employee=emp,
                    basic_salary=payroll.get('basic_salary', 0),
                    allowances_total=payroll.get('allowances_total', 0),
                    overtime_total=payroll.get('overtime_bonus', 0),
                    bonuses_total=payroll.get('bonuses_total', 0),
                    gross_salary=payroll.get('gross_salary', 0),
                    late_deduction=payroll.get('late_deduction', 0),
                    absence_deduction=payroll.get('absence_deduction', 0),
                    insurance_deduction=payroll.get('insurance_deduction', 0),
                    installments_total=payroll.get('installments_total', 0),
                    penalties_total=payroll.get('penalties_total', 0),
                    extra_deductions_total=payroll.get('extra_deductions_total', 0),
                    total_deductions=payroll.get('total_deductions', 0),
                    net_salary=payroll.get('net_salary', 0),
                    working_days=payroll.get('total_working_days', 0),
                    attended_days=payroll.get('attended_days', 0),
                    absent_days=payroll.get('absent_days', 0),
                    late_days=payroll.get('late_days', 0),
                    mission_days=payroll.get('mission_days', 0),
                    on_leave_days=payroll.get('on_leave_days', 0),
                    late_minutes=payroll.get('total_late_minutes', 0),
                    overtime_hours=payroll.get('overtime_hours', 0),
                    currency=payroll.get('currency', 'EGP'),
                    created_by=user,
                )
                grand_net += float(payroll.get('net_salary', 0) or 0)
                results.append(emp.id)
            except Exception as emp_err:
                errors.append({
                    'employee_id': emp.id,
                    'employee_name': f'{getattr(emp, "first_name_ar", "")} {getattr(emp, "last_name_ar", "")}'.strip(),
                    'error': str(emp_err),
                })

        return Response({
            'success': True,
            'run_id': run.id,
            'year': year,
            'month': month,
            'status': run.status,
            'total_employees': len(results),
            'grand_net': round(grand_net, 2),
            'errors_count': len(errors),
            'errors': errors,
            'message': f'تم حساب مرتبات {len(results)} موظف بنجاح',
        })
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)
'''

# Keep a single leading newline consistency
if not new_fn.startswith('\n'):
    new_fn = '\n' + new_fn

src2 = src[:m.start()] + new_fn + src[m.end():]
path.write_text(src2, encoding='utf-8')
print('✅ payroll_run_create rewritten cleanly')

# syntax check
import py_compile
py_compile.compile(str(path), doraise=True)
print('✅ Syntax OK')

from django.core.cache import cache
cache.clear()
print('✅ Cache cleared')
