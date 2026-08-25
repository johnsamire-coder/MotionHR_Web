import os

filePath = r'src/components/auth/login-form.tsx'
if os.path.exists(filePath):
    with open(filePath, 'r', encoding='utf-8') as f:
        print(f.read())
else:
    print('الملف غير موجود بالمسار المباشر!')
