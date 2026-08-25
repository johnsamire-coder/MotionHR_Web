import os

filePath = r'C:\MotionHR\Mobile\lib\services\employee_management_service.dart'
if os.path.exists(filePath):
    with open(filePath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'activate' in line.lower() or 'national' in line.lower():
            for j in range(max(0, i-2), min(len(lines), i+15)):
                print(f'{j+1}: {lines[j]}')
            break
else:
    print('الملف غير موجود بالمسار المباشر!')
