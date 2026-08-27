import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "https://jssolutions-eg.com";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/charter/acceptances/`, {
      headers: { Authorization: auth },
    });
    
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Backend error" }, { status: res.status });
    }
    
    const data = await res.json();
    
    // تحويل البيانات للشكل المتوافق مع الصفحة
    const formattedAcceptances: any[] = [];
    
    // 1. الموظفين الذين وافقوا
    if (data.accepted?.employees) {
      data.accepted.employees.forEach((emp: any) => {
        formattedAcceptances.push({
          employee_id: emp.id,
          employee_name: emp.name,
          employee_code: emp.username,
          accepted: true,
          accepted_at: emp.accepted_at ? new Date(emp.accepted_at).toLocaleString("ar-EG") : "",
        });
      });
    }
    
    // 2. الموظفين المنتظرين
    if (data.pending?.employees) {
      data.pending.employees.forEach((emp: any) => {
        formattedAcceptances.push({
          employee_id: emp.id,
          employee_name: emp.name,
          employee_code: emp.username,
          accepted: false,
        });
      });
    }
    
    return NextResponse.json(formattedAcceptances);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
