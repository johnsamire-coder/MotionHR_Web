import pathlib

p = pathlib.Path("src/app/hr/shifts/page.tsx")
if p.exists():
    content = p.read_text(encoding="utf-8")
    
    # 1. تحديث دالة getAuthHeader لتجريب كل مفاتيح التوكن المحتملة تلقائياً
    new_auth_header = """  const getAuthHeader = () => {
    if (typeof window === "undefined") return "";
    const token = localStorage.getItem(STORAGE_KEYS.token) || 
                  localStorage.getItem("token") || 
                  localStorage.getItem("jwt_access") || 
                  localStorage.getItem("motion_token") || "";
    if (!token) return "";
    if (token.startsWith("Token ") || token.startsWith("Bearer ")) return token;
    return "Token " + token;
  };"""

    # استبدال دالة getAuthHeader القديمة
    if "const getAuthHeader =" in content:
        start = content.find("const getAuthHeader =")
        end = content.find("};", start) + 2
        content = content[:start] + new_auth_header + content[end:]

    # 2. تحديث loadAllData لضمان جلب الشيفتات حتى لو فشلت الأقسام أو الفروع
    new_load_data = """  const loadAllData = useCallback(async () => {
    setLoading(true);
    const authHeader = getAuthHeader();
    const headers = { Authorization: authHeader, "Content-Type": "application/json" };

    const safeFetch = async (urls: string[]) => {
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const data = await res.json();
            return data;
          }
        } catch (e) {
          console.warn("Failed fetching from:", url, e);
        }
      }
      return null;
    };

    try {
      const [shiftsData, assignData, branchData, deptData, empData] = await Promise.all([
        safeFetch(["/api/hr/shifts", "/api/manager/shifts"]),
        safeFetch(["/api/hr/shifts/assignments", "/api/manager/shifts/assignments"]),
        safeFetch(["/api/branches", "/api/manager/branches", "/api/hr/branches"]),
        safeFetch(["/api/hr/departments", "/api/manager/departments"]),
        safeFetch(["/api/manager/employees", "/api/hr/employees"]),
      ]);

      if (shiftsData) {
        const list = Array.isArray(shiftsData) ? shiftsData : shiftsData.shifts || shiftsData.data || [];
        setShifts(list);
      }
      if (assignData) {
        const list = Array.isArray(assignData) ? assignData : assignData.assignments || assignData.data || [];
        setAssignments(list);
      }
      if (branchData) {
        const list = Array.isArray(branchData) ? branchData : branchData.branches || branchData.data || [];
        setBranches(list);
      }
      if (deptData) {
        const list = Array.isArray(deptData) ? deptData : deptData.departments || deptData.data || [];
        setDepartments(list);
      }
      if (empData) {
        const list = Array.isArray(empData) ? empData : empData.employees || empData.data || [];
        setEmployees(list);
      }
    } catch (err) {
      console.error("Error loading shifts page data:", err);
    } finally {
      setLoading(false);
    }
  }, [ar]);"""

    if "const loadAllData =" in content:
        start = content.find("const loadAllData =")
        end = content.find("}, [ar]);", start) + 8
        content = content[:start] + new_load_data + content[end:]

    p.write_text(content, encoding="utf-8")
    print("[OK] Shifts page updated with bulletproof auth & resilient fetch logic!")
else:
    print("[ERROR] shifts/page.tsx not found")
