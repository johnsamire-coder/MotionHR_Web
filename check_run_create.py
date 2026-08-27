from django.db import connection
with connection.cursor() as c:
    c.execute("SELECT id, name_ar, system_start_date FROM companies_company WHERE id=61;")
    print("Company:", c.fetchone())
    c.execute("SELECT id, year, month, status FROM attendance_payrollrun ORDER BY id DESC LIMIT 10;")
    print("Runs:", c.fetchall())
    c.execute("SELECT COUNT(*) FROM attendance_payrollline;")
    print("Lines count:", c.fetchone()[0])
    c.execute("SELECT column_name FROM information_schema.columns WHERE table_name='attendance_payrollline' ORDER BY ordinal_position;")
    print("Line columns:", [r[0] for r in c.fetchall()])
