import axios from "axios";

export interface EmployeeListItem {
  id: number;
  employee_code: string;
  full_name: string;
  photo?: string | null;
  job_title?: string;
  department?: string;
  department_id?: number;
  branch?: string;
  branch_id?: number;
  phone?: string;
  national_id?: string;
  status?: string;
  status_code?: string;
  email?: string;
  worker_type?: "office" | "field_free" | "field_assigned";
}

export interface EmployeeDetail extends EmployeeListItem {
  first_name_ar?: string;
  last_name_ar?: string;
  middle_name_ar?: string;
  first_name_en?: string;
  last_name_en?: string;
  birth_date?: string;
  gender?: string;
  marital_status?: string;
  religion?: string;
  nationality?: string;
  language?: string;
  address?: string;
  city?: string;
  phone2?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  hire_date?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  probation_months?: number;
  basic_salary?: number;
  currency?: string;
  salary_payment_method?: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  has_insurance?: boolean;
  insurance_number?: string;
  direct_manager_name?: string;
  attendance_mode?: string;
  [key: string]: unknown;
}

export interface EmployeesListResponse {
  count?: number;
  employees?: EmployeeListItem[];
  results?: EmployeeListItem[];
}

export interface EmployeesListParams {
  page?: number;
  page_size?: number;
  search?: string;
  department?: number | string;
  branch?: number | string;
  worker_type?: string;
  status?: string;
}

export const employeesApi = {
  list: async (
    params?: EmployeesListParams,
    token?: string | null
  ): Promise<EmployeesListResponse> => {
    const response = await axios.get<EmployeesListResponse>(
      "/api/employees/list",
      {
        params,
        headers: token ? { Authorization: `Token ${token}` } : {},
      }
    );
    return response.data;
  },

  getById: async (
    id: number | string,
    token?: string | null
  ): Promise<EmployeeDetail> => {
    const response = await axios.get<EmployeeDetail>(
      `/api/employees/${id}`,
      {
        headers: token ? { Authorization: `Token ${token}` } : {},
      }
    );
    return response.data;
  },
};
