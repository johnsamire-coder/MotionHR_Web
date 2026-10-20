"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UserCheck, Copy, Check, Phone, CreditCard, Lock } from "lucide-react";

import { loginSchema, LoginFormData } from "@/lib/schemas/auth";
import { authApi } from "@/lib/api/endpoints/auth";
import { useAuthStore } from "@/lib/stores/auth";
import { STORAGE_KEYS, ROUTES, ROLES } from "@/lib/constants/config";
import { BLOCKED_MESSAGE_KEY } from "@/components/auth/access-guard";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [nationalSuffix, setNationalSuffix] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [actStep, setActStep] = useState<1 | 2>(1);
  const [actUsername, setActUsername] = useState("");
  const [actLoading, setActLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // رسالة الإيقاف لو اتخرّج من السيستم عشان حسابه أو شركته موقوفة
  const [blockedMessage, setBlockedMessage] = useState("");
  useEffect(() => {
    try {
      const blocked = sessionStorage.getItem(BLOCKED_MESSAGE_KEY);
      if (blocked) {
        sessionStorage.removeItem(BLOCKED_MESSAGE_KEY);
        setBlockedMessage(blocked);
      }
    } catch {}
  }, []);

  const handleVerifyIdentity = async () => {
    if (!phone.trim() || !nationalSuffix.trim()) {
      toast.error("يرجى إدخال رقم الموبايل وآخر 4 أرقام من القومي");
      return;
    }
    setActLoading(true);
    try {
      const res = await fetch("https://jssolutions-eg.com/attendance/api/mobile/activate-account/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, national_id_suffix: nationalSuffix }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setActUsername(data.username || "");
        setActStep(2);
        toast.success(data.message || "تم التحقق من هويتك بنجاح!");
      } else {
        toast.error(data.message || "بيانات غير مطابقة. تأكد من إدخال البيانات المسجلة بالشركة");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setActLoading(false);
    }
  };

  const handleActivateAccount = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 رموز على الأقل");
      return;
    }
    setActLoading(true);
    try {
      const res = await fetch("https://jssolutions-eg.com/attendance/api/mobile/activate-account/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          national_id_suffix: nationalSuffix,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success("تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول 🎉");
        setActivateOpen(false);
        setActStep(1);
        setPhone("");
        setNationalSuffix("");
        setNewPassword("");
      } else {
        toast.error(data.message || "فشل تفعيل الحساب");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء التفعيل");
    } finally {
      setActLoading(false);
    }
  };

  const copyUsername = () => {
    if (actUsername) {
      navigator.clipboard.writeText(actUsername);
      setCopied(true);
      toast.success("تم نسخ اسم المستخدم! 📋");
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      {blockedMessage && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {blockedMessage}
        </div>
      )}
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

      <div className="pt-3 border-t text-center">
        <button
          type="button"
          onClick={() => {
            setActStep(1);
            setActivateOpen(true);
          }}
          className="inline-flex items-center gap-2 text-sm text-brand-accent hover:underline font-semibold"
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>تسجيل لأول مرة / تفعيل الحساب</span>
        </button>
      </div>

      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent className="max-w-md dir-rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-600">
              <UserCheck className="w-5 h-5" />
              <span>تفعيل الحساب لأول مرة</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              أدخل رقم الموبايل وآخر 4 أرقام من القومي لتفعيل حسابك وتعيين كلمة السر
            </DialogDescription>
          </DialogHeader>

          {actStep === 1 ? (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold block mb-1">رقم الموبايل</Label>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 01012345678"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold block mb-1">آخر 4 أرقام من الرقم القومي</Label>
                <Input
                  type="text"
                  maxLength={4}
                  value={nationalSuffix}
                  onChange={(e) => setNationalSuffix(e.target.value)}
                  placeholder="مثال: 1234"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-1">
                <span className="text-xs text-emerald-800 block font-medium">اسم المستخدم الخاص بك هو:</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base font-bold text-emerald-950 font-mono select-all">
                    {actUsername}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyUsername}
                    className="h-7 px-2 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-xs mr-1">{copied ? "تم النسخ" : "نسخ"}</span>
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">تعيين كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور (8 رموز على الأقل)"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setActivateOpen(false)} disabled={actLoading}>
              إلغاء
            </Button>
            {actStep === 1 ? (
              <Button onClick={handleVerifyIdentity} disabled={actLoading} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {actLoading ? "جاري التحقق..." : "التحقق من هويتي"}
              </Button>
            ) : (
              <Button onClick={handleActivateAccount} disabled={actLoading} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {actLoading ? "جاري التفعيل..." : "تفعيل الحساب والبدء"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
