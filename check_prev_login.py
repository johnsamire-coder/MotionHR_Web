import subprocess

try:
    git_show = subprocess.check_output(['git', 'show', 'HEAD~1:src/app/login/page.tsx'], encoding='utf-8')
    print('=== الأكواد في النسخة السابقة ===')
    for line in git_show.split('\n'):
        if 'fetch' in line or 'http' in line or 'login' in line.lower() or 'api' in line.lower():
            print('  ', line.strip())
except Exception as e:
    print('خطأ في جلب السجل:', e)
