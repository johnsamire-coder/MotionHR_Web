from pathlib import Path

# --- A) add endpoint function if missing ---
api_path = Path('/var/www/motionhr/attendance/api_mobile_leaves.py')
if not api_path.exists():
    # fallback search
    cands = list(Path('/var/www/motionhr/attendance').glob('*leave*.py'))
    print('leave api candidates:', [str(p) for p in cands])
else:
    print('using', api_path)

# Write dedicated endpoint file
endpoint = Path('/var/www/motionhr/attendance/api_manager_leave_requests.py')
endpoint.write_text('''
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manager_leave_requests(request):
    user = request.user
    company = getattr(user, "company", None)
    if company is None:
        emp = getattr(user, "employee_profile", None)
        company = getattr(emp, "company", None)
    if company is None:
        return Response({"success": False, "error": "no company"}, status=400)

    try:
        from leaves.models import LeaveRequest
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)

    status = (request.GET.get("status") or "all").strip().lower()
    year = request.GET.get("year")
    month = request.GET.get("month")

    qs = LeaveRequest._base_manager.filter(company=company).select_related(
        "employee", "leave_type", "employee__department", "employee__job_title"
    ).order_by("-created_at", "-id")

    if status and status != "all":
        qs = qs.filter(status=status)

    # optional period filter (does NOT apply when status=pending and all_pending=1)
    all_pending = request.GET.get("all_pending") == "1"
    if not (status == "pending" and all_pending):
        if year:
            try:
                y = int(year)
                qs = qs.filter(start_date__year=y)
            except Exception:
                pass
        if month:
            try:
                m = int(month)
                qs = qs.filter(start_date__month=m)
            except Exception:
                pass

    def emp_name(emp):
        if not emp:
            return "-"
        ar = f"{getattr(emp, 'first_name_ar', '')} {getattr(emp, 'last_name_ar', '')}".strip()
        if ar:
            return ar
        return f"{getattr(emp, 'first_name_en', '')} {getattr(emp, 'last_name_en', '')}".strip() or str(emp.id)

    items = []
    for lv in qs[:500]:
        emp = lv.employee
        lt = getattr(lv, "leave_type", None)
        days = None
        try:
            if lv.start_date and lv.end_date:
                days = (lv.end_date - lv.start_date).days + 1
        except Exception:
            days = getattr(lv, "days", None)
        items.append({
            "id": lv.id,
            "employee_id": getattr(emp, "id", None),
            "employee_name": emp_name(emp),
            "department": getattr(getattr(emp, "department", None), "name_ar", "") or "",
            "leave_type": getattr(lt, "name_ar", None) or getattr(lt, "name", None) or "إجازة",
            "from_date": str(lv.start_date) if lv.start_date else None,
            "to_date": str(lv.end_date) if lv.end_date else None,
            "status": lv.status,
            "days": days,
            "reason": getattr(lv, "reason", "") or "",
            "created_at": str(getattr(lv, "created_at", "") or ""),
        })

    # stats always on full company leaves (not only filtered list)
    base = LeaveRequest._base_manager.filter(company=company)
    stats = {
        "total": base.count(),
        "pending": base.filter(status="pending").count(),
        "approved": base.filter(status="approved").count(),
        "rejected": base.filter(status="rejected").count(),
        "cancelled": base.filter(status="cancelled").count(),
    }

    return Response({
        "success": True,
        "stats": stats,
        "count": len(items),
        "leaves": items,
        "today": str(timezone.localdate()),
    })
''', encoding='utf-8')
print('✅ wrote api_manager_leave_requests.py')

# --- B) wire URL ---
urls = Path('/var/www/motionhr/attendance/urls.py')
txt = urls.read_text(encoding='utf-8')
if 'manager_leave_requests' not in txt:
    # import
    if 'from .api_manager_leave_requests import manager_leave_requests' not in txt:
        txt = txt.replace(
            'from django.urls import path',
            'from django.urls import path\nfrom .api_manager_leave_requests import manager_leave_requests'
        )
    # path near other leave routes
    needle = "path('api/mobile/manager/leave-policy/'"
    addition = "    path('api/mobile/manager/leave-requests/', manager_leave_requests, name='manager_leave_requests'),\n"
    if needle in txt:
        txt = txt.replace(needle, addition + needle)
    else:
        # append before urlpatterns end
        txt += "\n# auto\n" + addition
    urls.write_text(txt, encoding='utf-8')
    print('✅ urls.py updated')
else:
    print('urls already has manager_leave_requests')

from django.core.cache import cache
cache.clear()
print('✅ cache cleared')
