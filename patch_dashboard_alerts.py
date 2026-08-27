import os, glob, re

search_dir = "/var/www/motionhr/attendance/"
target_string = "2 طلب معلق"

found = False
for filepath in glob.glob(os.path.join(search_dir, "*.py")):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if target_string in content:
        found = True
        new_alerts_code = """
    # --- Dynamic Alerts Logic ---
    total_pending = decisions.get('pending_requests', 0) + decisions.get('pending_leaves', 0) if 'decisions' in locals() else 0
    attention_count = len(need_attention) if 'need_attention' in locals() else 0
    
    alerts = []
    if total_pending > 0:
        alerts.append({
            'type': 'info',
            'icon': 'inbox',
            'title': f'{total_pending} طلب معلق ينتظر الموافقة',
            'action': '/hr/requests'
        })
    if attention_count > 0:
        alerts.append({
            'type': 'danger',
            'icon': 'alert-triangle',
            'title': f'{attention_count} موظف يحتاج متابعة (تأخير/غياب)',
            'action': '/hr/attendance'
        })
    # ----------------------------"""
        
        # استبدال المصفوفة الثابتة بالمنطق الديناميكي
        content = re.sub(r"alerts\s*=\s*\[[\s\S]*?\]", new_alerts_code, content)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ SUCCESSFULLY Patched hardcoded alerts in {os.path.basename(filepath)}")

if not found:
    print("⚠️ Target string not found. It might have been already patched.")
