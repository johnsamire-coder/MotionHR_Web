/**
 * Global Types - Matches Real Backend Response
 */

export interface EmployeeMini {
  id: number;
  name: string;
  first_name: string;
  gender: string;
  company: string;
  is_field_worker: boolean;
  stealth_tracking_enabled: boolean;
  should_track: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  access: string;
  refresh: string;
  must_change_password: boolean;
  role: string;
  app_mode: string;
  username: string;
  full_name: string;
  first_name: string;
  gender: string;
  company_name: string;
  employee: EmployeeMini;
}

export interface User {
  username: string;
  full_name: string;
  first_name: string;
  gender: string;
  role: string;
  app_mode: string;
  must_change_password: boolean;
}

export interface Company {
  name: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  first_name_ar: string;
  last_name_ar: string;
  first_name_en?: string;
  last_name_en?: string;
  email?: string;
  phone: string;
  national_id: string;
  hire_date: string;
  worker_type: "office" | "field_free" | "field_assigned";
  status: string;
  basic_salary: number;
  branch?: number;
  department?: number;
  job_title?: number;
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}
