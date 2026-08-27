import inspect
from attendance import api_payroll

print("--- Available functions in api_payroll: ---")
funcs = [f for f in dir(api_payroll) if 'run' in f or 'export' in f]
print(funcs)

for f_name in ['payroll_runs_list', 'payroll_run_create', 'payroll_run_detail', 'payroll_run_approve']:
    if hasattr(api_payroll, f_name):
        print(f"\n================ [Function: {f_name}] ================")
        print(inspect.getsource(getattr(api_payroll, f_name))[:600])
