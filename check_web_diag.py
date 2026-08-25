import os, re

page_path = r'src/app/hr/shifts/page.tsx'
with open(page_path, 'r', encoding='utf-8') as f:
    text = f.read()

# التأكد من عدم وجود أخطاء syntax زادت في JSX
print('عدد أوسمة DialogContent:', text.count('<DialogContent'))
print('عدد أوسمة Dialog:', text.count('<Dialog'))
print('هل يوجد استيراد لمكون شيفت خارجي؟', 'import' in text and 'Shift' in text)
