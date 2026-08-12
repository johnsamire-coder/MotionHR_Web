"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, User, Mail, Phone, Lock,
  Loader2, CheckCircle2, MessageCircle, Copy, KeyRound,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLangStore } from "@/lib/stores/language";
import { useAuthStore } from "@/lib/stores/auth";
import { STORAGE_KEYS } from "@/lib/constants/config";

const WHATSAPP_URL = "https://wa.me/201501551593";

interface SignupResult {
  username: string;
  password: string;
  companyName: string;
  daysRemaining: number;
  maxEmployees: number;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export default function SignupPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const setAuth = useAuthStore((s) => s.setAuth);
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [result, setResult] = useState<SignupResult | null>(null);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    owner_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [planLimits, setPlanLimits] = useState({ max_employees: 5, trial_days: 14 });

  useEffect(() => {
    fetch("/api/plan-info").then(r => r.json()).then(data => {
      if (data?.max_employees) setPlanLimits(data);
    }).catch(() => {});
  }, []);

  const t = {
    title:          ar ? "ابدأ تجربتك المجانية" : "Start Your Free Trial",
    subtitle:       ar ? "14 يوم مجاناً - بدون بطاقة ائتمان" : "14 days free - No credit card required",
    companyName:    ar ? "اسم الشركة" : "Company Name",
    ownerName:      ar ? "اسمك الكامل" : "Your Full Name",
    email:          ar ? "البريد الإلكتروني" : "Email",
    phone:          ar ? "رقم الهاتف" : "Phone Number",
    password:       ar ? "كلمة السر" : "Password",
    confirmPass:    ar ? "تأكيد كلمة السر" : "Confirm Password",
    submit:         ar ? "إنشاء الحساب المجاني" : "Create Free Account",
    creating:       ar ? "جاري إنشاء حسابك..." : "Creating account...",
    haveAccount:    ar ? "عندك حساب؟" : "Have an account?",
    login:          ar ? "سجل دخول" : "Login",
    backHome:       ar ? "العودة للرئيسية" : "Back to Home",
    orWhatsapp:     ar ? "أو تواصل معانا مباشرة" : "Or contact us directly",
    whatsappBtn:    ar ? "احجز ديمو على واتساب" : "Book WhatsApp Demo",
    passMismatch:   ar ? "كلمة السر غير متطابقة" : "Passwords don't match",
    passTooShort:   ar ? "كلمة السر يجب 6 حروف على الأقل" : "Password must be at least 6 chars",
    features: [
      ar ? `${planLimits.max_employees} موظفين + مدير` : `${planLimits.max_employees} employees + admin`,
      ar ? "كل ميزات النظام" : "All system features",
      ar ? "دعم فني على واتساب" : "WhatsApp support",
      ar ? "بدون بطاقة ائتمان" : "No credit card",
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error(t.passTooShort);
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error(t.passMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          owner_name:   form.owner_name,
          email:        form.email,
          phone:        form.phone,
          password:     form.password,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          username: data.user.username,
          password: form.password,
          companyName: data.company.name_ar,
          daysRemaining: data.subscription.days_remaining,
          maxEmployees: data.subscription.max_employees,
          token: data.token,
          user: data.user,
        });
        setStep("success");
      } else {
        toast.error(data.error || (ar ? "فشل إنشاء الحساب" : "Signup failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "user" | "pass") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "user") {
        setCopiedUser(true);
        setTimeout(() => setCopiedUser(false), 2000);
      } else {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
      }
      toast.success(ar ? "تم النسخ ✓" : "Copied ✓");
    } catch {
      toast.error(ar ? "فشل النسخ" : "Copy failed");
    }
  };

  const handleGoToDashboard = () => {
    if (!result) return;

    // SIGNUP-1: نستخدم Zustand store - نبعت الـ token خام بدون prefix
    const rawToken = result.token.replace(/^Token\s+/i, "").replace(/^Bearer\s+/i, "").trim();
    const tokenValue = `Token ${rawToken}`;

    setAuth({
      user: {
        ...result.user,
        full_name: `${result.user.first_name} ${result.user.last_name}`.trim(),
      } as any,
      company: { name: result.companyName } as any,
      employee: null as any,
      token: tokenValue,
    });

    // redirect بعد شوية
    setTimeout(() => {
      window.location.href = "/hr/dashboard";
    }, 200);
  };

  // ── SUCCESS SCREEN ─────────────────────────────
  if (step === "success" && result) {
    return (
      <div dir={dir} className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-brand-primary/5 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-center text-white">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                🎉 {ar ? "مبروك! تم إنشاء حسابك" : "Congrats! Account Created"}
              </h1>
              <p className="text-white/90">
                {ar
                  ? `شركة "${result.companyName}" جاهزة للاستخدام`
                  : `Company "${result.companyName}" is ready`}
              </p>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 mb-1">
                  {ar ? "⚠️ مهم جداً - احفظ بيانات الدخول" : "⚠️ Important - Save Your Credentials"}
                </p>
                <p className="text-sm text-amber-800">
                  {ar
                    ? "دي بياناتك اللي هتستخدمها كل مرة تدخل بيها. احفظها في مكان آمن أو انسخها دلوقتي."
                    : "These are your login credentials. Save them somewhere safe or copy them now."}
                </p>
              </div>
            </div>

            {/* Credentials */}
            <div className="p-6 space-y-4">
              {/* Username */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    {ar ? "اسم المستخدم (Username)" : "Username"}
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.username, "user")}
                    className="h-8 gap-1"
                  >
                    {copiedUser ? (
                      <><CheckCircle2 className="w-3 h-3 text-emerald-600" /> {ar ? "تم النسخ" : "Copied"}</>
                    ) : (
                      <><Copy className="w-3 h-3" /> {ar ? "نسخ" : "Copy"}</>
                    )}
                  </Button>
                </div>
                <div className="bg-white border border-slate-300 rounded-lg px-4 py-3 font-mono text-lg font-bold text-brand-primary select-all" dir="ltr">
                  {result.username}
                </div>
              </div>

              {/* Password */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5" />
                    {ar ? "كلمة السر (Password)" : "Password"}
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.password, "pass")}
                    className="h-8 gap-1"
                  >
                    {copiedPass ? (
                      <><CheckCircle2 className="w-3 h-3 text-emerald-600" /> {ar ? "تم النسخ" : "Copied"}</>
                    ) : (
                      <><Copy className="w-3 h-3" /> {ar ? "نسخ" : "Copy"}</>
                    )}
                  </Button>
                </div>
                <div className="bg-white border border-slate-300 rounded-lg px-4 py-3 font-mono text-lg font-bold text-brand-primary select-all" dir="ltr">
                  {result.password}
                </div>
              </div>

              {/* Trial Info */}
              <div className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 border border-brand-primary/20 rounded-2xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-brand-primary">{result.daysRemaining}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ar ? "يوم تجربة مجانية" : "Days Free Trial"}
                    </p>
                  </div>
                  <div className="text-center border-r border-brand-primary/20">
                    <p className="text-3xl font-bold text-brand-primary">{result.maxEmployees}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ar ? "موظفين متاحين" : "Available Employees"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full h-12 text-base bg-brand-primary hover:bg-brand-secondary gap-2"
                >
                  {ar ? "ابدأ استخدام النظام الآن" : "Start Using MotionHR Now"}
                  <ArrowLeft className={`w-4 h-4 ${ar ? "" : "rotate-180"}`} />
                </Button>

                <Link href={WHATSAPP_URL} target="_blank">
                  <Button variant="outline" className="w-full gap-2 h-11 border-green-500/30 text-green-700 hover:bg-green-500/5">
                    <MessageCircle className="w-4 h-4" />
                    {ar ? "احتاج مساعدة؟ اتواصل معانا" : "Need help? Contact us"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {ar
              ? "💡 نصيحة: اعمل screenshot لبيانات الدخول أو ابعتها لنفسك على إيميل"
              : "💡 Tip: Take a screenshot or email these credentials to yourself"}
          </p>
        </div>
      </div>
    );
  }

  // ── FORM SCREEN ────────────────────────────────
  return (
    <div dir={dir} className="min-h-screen grid lg:grid-cols-2 relative">
      {/* Left */}
      <div className="hidden lg:flex relative overflow-hidden gradient-brand items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-brand-accent/40 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-brand-highlight/30 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md text-white">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition mb-12">
            <ArrowLeft className={`w-4 h-4 ${ar ? "" : "rotate-180"}`} />
            <span className="text-sm">{t.backHome}</span>
          </Link>

          <Image src="/brand/logo/logo-white.png" alt="MotionHR"
            width={200} height={60} style={{ width: "auto", height: "auto" }}
            className="mb-8" priority />

          <h1 className="text-4xl font-bold mb-4 leading-tight">
            {ar ? "جرّب MotionHR" : "Try MotionHR"}
            <br />
            <span className="text-brand-accent">{ar ? "14 يوم مجاناً" : "14 Days Free"}</span>
          </h1>

          <p className="text-lg text-white/80 mb-10">
            {ar
              ? "شركتك تحتاج نظام محترم لإدارة الحضور والمرتبات والمأموريات؟ MotionHR هو الحل."
              : "Your company needs a serious HR system? MotionHR is the answer."}
          </p>

          <div className="space-y-3">
            {t.features.map((f) => (
              <div key={f} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-brand-accent shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm"
              onClick={() => setLang(ar ? "en" : "ar")}
              className="min-w-[60px] font-semibold">
              {ar ? "EN" : "عربي"}
            </Button>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight mb-2">{t.title}</h2>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-primary" />
                {t.companyName} *
              </label>
              <Input required value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder={ar ? "مثال: شركة النور للتجارة" : "e.g. Al Noor Trading"}
                disabled={loading} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-primary" />
                {t.ownerName} *
              </label>
              <Input required value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                placeholder={ar ? "الاسم الأول والأخير" : "First and last name"}
                disabled={loading} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary" />
                {t.email} *
              </label>
              <Input required type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@company.com" dir="ltr" disabled={loading} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary" />
                {t.phone} *
              </label>
              <Input required type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01xxxxxxxxx" dir="ltr" disabled={loading} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-primary" />
                  {t.password} *
                </label>
                <Input required type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6} disabled={loading} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-primary" />
                  {t.confirmPass} *
                </label>
                <Input required type="password" value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  minLength={6} disabled={loading} />
              </div>
            </div>

            <Button type="submit" disabled={loading}
              className="w-full h-12 text-base gap-2 bg-brand-primary hover:bg-brand-secondary mt-2">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t.creating}</>
              ) : (
                <>{t.submit} <ArrowLeft className={`w-4 h-4 ${ar ? "" : "rotate-180"}`} /></>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-center text-sm text-muted-foreground mb-3">{t.orWhatsapp}</p>
            <Link href={WHATSAPP_URL} target="_blank">
              <Button variant="outline" className="w-full gap-2 h-11 border-green-500/30 text-green-700 hover:bg-green-500/5">
                <MessageCircle className="w-5 h-5" />
                {t.whatsappBtn}
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t.haveAccount}{" "}
            <Link href="/login" className="text-brand-primary font-semibold hover:underline">
              {t.login}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}