import inspect
from attendance import api_payroll
from attendance import urls

print("=== 1. CHECKING PAYROLL RUN URLS IN BACKEND ===")
for p in urls.urlpatterns:
    if hasattr(p, 'pattern') and 'run' in str(p.pattern):
        print(f"Path: {p.pattern} -> {getattr(p.callback, '__name__', p.callback)}")

print("\n=== 2. PAYROLL_RUN_DETAIL SOURCE CODE ===")
if hasattr(api_payroll, 'payroll_run_detail'):
    print(inspect.getsource(api_payroll.payroll_run_detail))
