import os

filePath = r'C:\MotionHR\Mobile\lib\screens\auth\activate_account_screen.dart'
if os.path.exists(filePath):
    with open(filePath, 'r', encoding='utf-8') as f:
        print(f.read())
else:
    print('الملف غير موجود بالمسار المباشر!')
