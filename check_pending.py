import os, sys
sys.path.insert(0, '/var/www/motionhr')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from leaves.models import LeaveRequest
from requests_app.models import EmployeeRequest

User = get_user_model()
u = User.objects.filter(username='gpr_admin').first()
comp_id = getattr(u, 'company_id', None) or getattr(getattr(u, 'employee_profile', None), 'company_id', None)

print("=== 1. PENDING LEAVE REQUESTS IN DB ===")
pending_leaves = list(LeaveRequest.objects.filter(company_id=comp_id, status='pending').values('id', 'employee__first_name_ar', 'leave_type__name_ar', 'start_date', 'end_date'))
print(f"Total Pending Leaves: {len(pending_leaves)}")
for l in pending_leaves:
    print(l)

print("\n=== 2. PENDING GENERAL REQUESTS IN DB ===")
pending_reqs = list(EmployeeRequest.objects.filter(company_id=comp_id, status='pending').values('id', 'employee__first_name_ar', 'request_type__name_ar', 'created_at'))
print(f"Total Pending General Requests: {len(pending_reqs)}")
for r in pending_reqs:
    print(r)
