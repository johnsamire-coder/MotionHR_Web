export interface DashboardData {
  pulse: {
    total_employees: number;
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    attendance_rate: number;
  };
  decisions: {
    pending_requests: number;
    pending_leaves: number;
    contracts_expiry: number;
    probation_ending: number;
  };
  top_performers: Array<{
    employee_name: string;
    attendance_rate: number;
    on_time_percentage: number;
  }>;
  need_attention: Array<{
    employee_name: string;
    issue: string;
    days: number;
  }>;
}
