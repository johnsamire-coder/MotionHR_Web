/**
 * MotionHR Web - Global Configuration
 */

export const APP_CONFIG = {
  name: "MotionHR",
  fullName: "MotionHR - Workforce Platform",
  description: "The Workforce Operating System",
  version: "1.0.0",
  designedBy: {
    name: "Eng/John Samir",
    company: "JS Solutions",
    label: "Designed & Developed by",
  },
} as const;

// Use proxy in browser to avoid CORS
// Server-side calls go direct to backend
const isBrowser = typeof window !== "undefined";

export const API_CONFIG = {
  baseUrl: isBrowser
    ? "" // Browser uses Next.js proxy (relative URL)
    : "https://jssolutions-eg.com", // Server-side direct
  apiPrefix: isBrowser
    ? "/backend/attendance/api/mobile"
    : "/attendance/api/mobile",
  timeout: 30000,
} as const;

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",

  employee: {
    dashboard: "/employee/dashboard",
    attendance: "/employee/attendance",
    leaves: "/employee/leaves",
    requests: "/employee/requests",
    missions: "/employee/missions",
    payslip: "/employee/payslip",
    profile: "/employee/profile",
  },

  manager: {
    dashboard: "/manager/dashboard",
    team: "/manager/team",
    attendance: "/manager/attendance",
    locations: "/manager/locations",
    missions: "/manager/missions",
    requests: "/manager/requests",
    reports: "/manager/reports",
  },

  hr: {
    dashboard: "/hr/dashboard",
    employees: "/hr/employees",
    import: "/hr/employees/import",
    payroll: "/hr/payroll",
    policies: "/hr/policies",
    shifts: "/hr/shifts",
    reports: "/hr/reports",
  },

  admin: {
    dashboard: "/admin/dashboard",
    companies: "/admin/companies",
    users: "/admin/users",
    settings: "/admin/settings",
  },
} as const;

export const STORAGE_KEYS = {
  token: "motionhr_token",
  refreshToken: "motionhr_refresh_token",
  user: "motionhr_user",
  company: "motionhr_company",
  employee: "motionhr_employee",
  language: "motionhr_language",
  theme: "motionhr_theme",
} as const;

export const ROLES = {
  employee: "employee",
  manager: "manager",
  hrManager: "hr_manager",
  companyAdmin: "company_admin",
  superAdmin: "super_admin",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
