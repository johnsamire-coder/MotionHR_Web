import calendar
import datetime

file_path = '/var/www/motionhr/attendance/api_payroll.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_str = '    for emp in employees:\n        payroll = calculate_effective_payroll(emp, year, month, settings, lang=lang)'

replacement_str = '''    import calendar, datetime
    _, last_day = calendar.monthrange(year, month)
    month_start = datetime.date(year, month, 1)
    month_end = datetime.date(year, month, last_day)

    for emp in employees:
        if emp.hire_date and emp.hire_date > month_end:
            continue
        if getattr(emp, 'termination_date', None) and emp.termination_date < month_start:
            continue

        payroll = calculate_effective_payroll(emp, year, month, settings, lang=lang)'''

if target_str in content:
    content = content.replace(target_str, replacement_str, 1)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: api_payroll.py patched successfully!")
else:
    print("WARNING: target_str not found directly. Checking if already patched...")
    if "if emp.hire_date and emp.hire_date > month_end:" in content:
        print("ALREADY_PATCHED: The logic is already present in api_payroll.py")
    else:
        print("FAILED: Could not locate target loop.")
