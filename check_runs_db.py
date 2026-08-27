from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()
u = User.objects.filter(username='gpr_admin').first()
company_id = getattr(u, 'company_id', None) or getattr(getattr(u, 'employee_profile', None), 'company_id', None)

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%payroll%run%';
    """)
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Payroll Run Tables Found: {tables}")

    if tables:
        tbl = tables[0]
        cursor.execute(f"SELECT COUNT(*) FROM {tbl} WHERE company_id = %s;", [company_id])
        cnt = cursor.fetchone()[0]
        print(f"Total Runs for Company {company_id}: {cnt}")
