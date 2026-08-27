from companies.models import Company
from attendance.models import AttendancePolicy
from attendance.company_policy_models import CompanyWorkPolicy

print("=== 1. COMPANY FIELDS ===")
print([f.name for f in Company._meta.get_fields() if not f.is_relation])

print("\n=== 2. CURRENT COMPANY (ID: 61) INFO ===")
comp = Company.objects.filter(id=61).first()
if comp:
    for f in [f.name for f in Company._meta.get_fields() if not f.is_relation]:
        print(f"{f}: {getattr(comp, f, None)}")
