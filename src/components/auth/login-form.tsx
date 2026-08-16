"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { loginSchema, LoginFormData } from "@/lib/schemas/auth";
import { authApi } from "@/lib/api/endpoints/auth";
import { useAuthStore } from "@/lib/stores/auth";
import { STORAGE_KEYS, ROUTES, ROLES } from "@/lib/constants/config";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Remember Me — جلب الداتا المحفوظة
  const savedUsername = typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEYS.savedUsernamee) || ""
    : "";
  const savedRememberMe = typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEYS.rememberMe) === "true"
    : false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: savedUsername,
      password: "",
      remember_me: savedRememberMe,
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({
        username: values.username,
        password: values.password,
      });

      if (!response.success) {
        toast.error(response.message || "فشل تسجيل الدخول");
        return;
      }

      // Save tokens
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.token, response.token);
        if (response.refresh) {
          localStorage.setItem(STORAGE_KEYS.refreshToken, response.refresh);
        }
        // Remember Me
        if (values.remember_me) {
          localStorage.setItem(STORAGE_KEYS.rememberMe, "true");
          localStorage.setItem(STORAGE_KEYS.savedUsernamee, values.username);
        } else {
          localStorage.removeItem(STORAGE_KEYS.rememberMe);
          localStorage.removeItem(STORAGE_KEYS.savedUsernamee);
        }
      }

      // Update store
      setAuth({
        user: {
          username: response.username,
          full_name: response.full_name,
          first_name: response.first_name,
          gender: response.gender,
          role: response.role,
          app_mode: response.app_mode,
          must_change_password: response.must_change_password,
        },
        company: {
          name: response.company_name,
        },
        employee: response.employee,
        token: response.token,
        refreshToken: response.refresh,
      });

      toast.success(`أهلاً بيك، ${response.first_name}`);

      // must_change_password check
      if (response.must_change_password) {
        router.push("/change-password");
        return;
      }

      // Redirect based on role
      let redirectPath = ROUTES.employee.dashboard;

      if (response.role === ROLES.superAdmin) {
        redirectPath = ROUTES.admin.dashboard;
      } else if (
        response.role === ROLES.companyAdmin ||
        response.role === ROLES.hrManager
      ) {
        redirectPath = ROUTES.hr.dashboard;
      } else if (response.role === ROLES.manager) {
        redirectPath = ROUTES.manager.dashboard;
      } else {
        redirectPath = ROUTES.employee.dashboard;
      }

      if (redirectPath.startsWith("http")) {
        window.location.href = redirectPath;
      } else {
        router.push(redirectPath);
      }
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            detail?: string;
            message?: string;
            non_field_errors?: string[];
          };
        };
      };
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "بيانات الدخول غير صحيحة";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username">اسم المستخدم</Label>
        <Input
          id="username"
          type="text"
          placeholder="username"
          autoComplete="username"
          disabled={isLoading}
          {...register("username")}
          aria-invalid={!!errors.username}
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
            {...register("password")}
            aria-invalid={!!errors.password}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox
            {...register("remember_me")}
            disabled={isLoading}
          />
          <span>تذكرني</span>
        </label>
        <button
          type="button"
          onClick={() => toast.info("من فضلك تواصل مع مسئول الموارد البشرية لإعادة تعيين كلمة المرور الخاصة بك.")}
          className="text-sm text-brand-accent hover:underline"
        >
          نسيت كلمة المرور؟
        </button>
      </div>

      <Button
        type="submit"
        className="w-full h-11 gap-2 text-base"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جارِ تسجيل الدخول...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            تسجيل الدخول
          </>
        )}
      </Button>
    </form>
  );
}
