import pathlib

p = pathlib.Path('src/components/hr/policies/attendance-policy-dialog.tsx')
if p.exists():
    lines = p.read_text(encoding='utf-8').splitlines()
    print("=== Absence Section Snippet ===")
    for i, l in enumerate(lines):
        if 'ABSENCE_DEDUCTION_TYPES' in l or 'absence_type' in l or 'consecutive' in l:
            print(f"  Line {i+1:4d}: {l.strip()[:90]}")
