from django.contrib.auth import get_user_model
from employees.models import Employee
from attendance.models import Attendance, DailyAttendanceSummary
import inspect

User = get_user_model()
u = User.objects.filter(username='gpr_admin').first()

print("=== 1. HIRE DATES OF PAYROLL EMPLOYEES (3664 to 3678) ===")
emps = Employee._base_manager.filter(id__gte=3664, id__lte=3678)
for e in emps:
    print(f"ID: {e.id} | Code: {e.employee_code} | Name: {e.first_name_ar} {e.last_name_ar} | hire_date: {e.hire_date}")

print("\n=== 2. ATTENDANCE DATES PRESENT IN DATABASE FOR THIS COMPANY ===")
company_id = getattr(u, 'company_id', None) or getattr(getattr(u, 'employee_profile', None), 'company_id', None)
print(f"Company ID: {company_id}")

dates = DailyAttendanceSummary.objects.filter(company_id=company_id).values_list('date__year', 'date__month').distinct()
print(f"Distinct Summary (Year, Month): {list(dates)}")

att_dates = Attendance.objects.filter(company_id=company_id).values_list('date__year', 'date__month').distinct()
print(f"Distinct Attendance (Year, Month): {list(att_dates)}")
