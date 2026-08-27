import re

file_path = "/var/www/motionhr/attendance/api_reports.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. إصلاح التنبيهات لتفصل الإجازات عن الطلبات العامة
old_alerts = '''    if pending_requests + pending_leaves > 0:
        alerts.append({
            'type': 'info',
            'icon': 'inbox',
            'title': f'{pending_requests + pending_leaves} طلب معلق ينتظر الموافقة',
            'action': '/hr/requests',
        })'''

new_alerts = '''    if pending_requests > 0:
        alerts.append({
            'type': 'info',
            'icon': 'inbox',
            'title': f'{pending_requests} طلب معلق ينتظر الموافقة',
            'action': '/hr/requests',
        })

    if pending_leaves > 0:
        alerts.append({
            'type': 'info',
            'icon': 'calendar',
            'title': f'{pending_leaves} طلب إجازة معلق ينتظر الموافقة',
            'action': '/hr/leaves',
        })'''

if old_alerts in content:
    content = content.replace(old_alerts, new_alerts)
    print("✅ Fixed Pending Requests vs Pending Leaves Alert separation.")

# 2. إصلاح مطابقة عدد need_attention
content = content.replace("'need_attention': need_attention[:5]", "'need_attention': need_attention")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ api_reports.py patched successfully!")
