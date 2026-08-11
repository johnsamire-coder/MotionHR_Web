import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/work-locations/page.tsx")
text = p.read_text(encoding="utf-8")

# نشيل التكرار - نبحث عن الـ block اللي فيه states مكررة
duplicate = """  const [submitting, setSubmitting] = useState(false);
  const [assignLoc, setAssignLoc] = useState<WorkLocation | null>(null);
  const [allEmployees, setAllEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState("locations");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [assignLoc, setAssignLoc] = useState<WorkLocation | null>(null);
  const [allEmployees, setAllEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);"""

clean = """  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("locations");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [assignLoc, setAssignLoc] = useState<WorkLocation | null>(null);
  const [allEmployees, setAllEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);"""

if duplicate in text:
    text = text.replace(duplicate, clean)
    print("[OK] Removed duplicate states")
else:
    print("[WARN] Trying line-by-line...")
    lines = text.split('\n')
    seen_names = set()
    new_lines = []
    for line in lines:
        # نلاقي states مكررة
        skip = False
        for name in ['assignLoc,', 'allEmployees,', 'selectedEmpIds,', 'assigning,']:
            if name in line and 'useState' in line:
                if name in seen_names:
                    skip = True
                    break
                seen_names.add(name)
        if not skip:
            new_lines.append(line)
    text = '\n'.join(new_lines)
    print("[OK] Cleaned duplicates line-by-line")

p.write_text(text, encoding="utf-8")
print(f"Saved: {p.stat().st_size} bytes")
