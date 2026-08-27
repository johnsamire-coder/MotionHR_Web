from leaves.models import LeaveRequest
from django.contrib.auth import get_user_model
User=get_user_model()
u=User.objects.filter(username='gpr_admin').first()
cid=getattr(u,'company_id',None) or getattr(getattr(u,'employee_profile',None),'company_id',None)
print('company_id=', cid)
qs=LeaveRequest._base_manager.filter(company_id=cid)
print('ALL statuses:')
from collections import Counter
print(Counter(list(qs.values_list('status', flat=True))))
print('\nPENDING details:')
for x in qs.filter(status='pending'):
    emp=x.employee
    name=f"{getattr(emp,'first_name_ar','')} {getattr(emp,'last_name_ar','')}".strip() if emp else '-'
    lt=getattr(getattr(x,'leave_type',None),'name_ar',None)
    print(f"id={x.id} emp={name} type={lt} {x.start_date} -> {x.end_date} status={x.status}")
