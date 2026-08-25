import os

login_path = r'src/app/login/page.tsx'
if os.path.exists(login_path):
    with open(login_path, 'r', encoding='utf-8') as f:
        text = f.read()
    print('طول ملف الدخول بالويب:', len(text), 'حرف')
    print('هل يحتوي على Button؟', 'Button' in text)
    print('هل يحتوي على Input؟', 'Input' in text)
