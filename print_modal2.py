import os, re

filePath = r'src/app/hr/shifts/page.tsx'
with open(filePath, 'r', encoding='utf-8') as f:
    text = f.read()

dialogs = re.findall(r'<DialogContent[\s\S]*?</DialogContent>', text)
if len(dialogs) >= 2:
    print('=== محتوى المودال رقم 2 الفعلي بالكامل ===')
    print(dialogs[1])
