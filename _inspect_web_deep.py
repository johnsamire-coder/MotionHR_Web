import pathlib

BASE = pathlib.Path('.')

print("=== 1. ALL PAGES IN src/app/ ===")
for p in sorted(BASE.glob('src/app/**/page.tsx')):
    print(f"  - {p.relative_to(BASE)}")

print("\n=== 2. ALL API & LIB FILES ===")
for p in sorted(BASE.glob('src/lib/**/*.*')):
    print(f"  - {p.relative_to(BASE)}")

for p in sorted(BASE.glob('src/services/**/*.*')):
    print(f"  - {p.relative_to(BASE)}")

print("\n=== 3. ALL HR COMPONENTS IN src/components/ ===")
for p in sorted(BASE.glob('src/components/**/*.tsx')):
    if any(k in str(p).lower() for k in ['attend', 'leave', 'shift', 'policy', 'dialog']):
        print(f"  - {p.relative_to(BASE)}")

