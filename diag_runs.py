import inspect
from attendance import api_payroll

print("=== 1. PAYROLL RUNS VIEW CODE ===")
for attr in ['payroll_runs_list', 'payroll_runs', 'payroll_run_create', 'payroll_run_detail', 'payroll_run_export']:
    if hasattr(api_payroll, attr):
        print(f"\n--- Found: {attr} ---")
        try:
            print(inspect.getsource(getattr(api_payroll, attr))[:500])
        except:
            pass

# استدعاء مباشر للـ API لمعرفة ما يرجعه لحساب gpr_admin
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from attendance.api_payroll import _get_company_employees

User = get_user_model()
u = User.objects.filter(username='gpr_admin').first()

from attendance.models import Shift # or PayrollRun
from attendance.models_payroll import PayrollRun, PayrollLine rescue_models = False
print("\n=== 2. CHECKING PAYROLL RUNS IN DB FOR GPR ===")
try:
    from attendance.models import PayrollRun
    runs = list(PayrollRun.objects.filter(company_id=61).values())
    print("Found PayrollRun objects:", runs)
except Exception as e:
    print("PayrollRun query error:", e)
