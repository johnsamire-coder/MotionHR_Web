from django.utils import timezone
from django.db import connection
print("Server now:", timezone.localtime())
print("Server today:", timezone.localdate())
with connection.cursor() as c:
    c.execute("SELECT id, name_ar, system_start_date FROM companies_company WHERE id=61;")
    print("Company:", c.fetchone())
    c.execute("SELECT id, year, month, status FROM attendance_payrollrun WHERE company_id=61 ORDER BY year, month;")
    print("Existing runs:", c.fetchall())
