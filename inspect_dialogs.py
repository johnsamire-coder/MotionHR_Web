import os, re

filePath = r'src/app/hr/shifts/page.tsx'
with open(filePath, 'r', encoding='utf-8') as f:
    text = f.read()

# البحث عن جميع عناوين الأقسام أو المودالات
dialogs = re.findall(r'<DialogContent[\s\S]*?</DialogContent>', text)
print(f'عدد أوسمة DialogContent الفردية المكتشفة بالملف: {len(dialogs)}\n')

for idx, d in enumerate(dialogs):
    print(f'=== [مودال رقم {idx+1}] ===')
    if 'تعديل الشيفت' in d or 'تعديل' in d or 'editingShift' in d or 'Grace' in d or 'سماح التأخير' in d:
        print('🎯 هذا هو المودال المستهدف!')
    else:
        print('ℹ️ مودال آخر')
    
    # طباعة أول 300 حرف من المودال
    lines = d.split('\n')
    for l in lines[:15]:
        print('  ', l)
    print('-'*40)
