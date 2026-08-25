import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 dir-rtl">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">MotionHR</h2>
          <p className="text-sm text-slate-500">تسجيل الدخول إلى حسابك</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
