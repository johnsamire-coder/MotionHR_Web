"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, User, Mail, Phone, Lock,
  Loader2, CheckCircle2, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

const WHATSAPP_URL = "https://wa.me/201501551593";

export default function SignupPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");

  const [form, setForm] = useState({
    company_name: "",
    owner_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

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
    successTitle:   ar ? "🎉 مبروك! تم إنشاء حسابك" : "🎉 Congrats! Your account is ready",
    successDesc:    ar ? "هيتم توجيهك للنظام خلال ثواني..." : "Redirecting to your dashboard...",
    passMismatch:   ar ? "كلمة السر غير متطابقة" : "Passwords don't match",
    passTooShort:   ar ? "كلمة السر يجب 6 حروف على الأقل" : "Password must be at least 6 chars",
    features: [
      ar ? "5 موظفين + مدير" : "5 employees + admin",
      ar ? "كل ميزات النظام" : "All system features",
      ar ? "دعم فني على واتساب" : "WhatsApp support",
      ar ? "بدون بطاقة ائتمان" : "No credit card",
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
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
        // Save token & redirect
        localStorage.setItem(STORAGE_KEYS.token, `Token ${data.token}`);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        localStorage.setItem("motionhr_subscription", JSON.stringify(data.subscription));

        setStep("success");
        setTimeout(() => {
          router.push("/hr/dashboard");
        }, 2000);
      } else {
        toast.error(data.error || (ar ? "فشل إنشاء الحساب" : "Signup failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div dir={dir} className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold mb-3">{t.successTitle}</h1>
          <p className="text-muted-foreground mb-8">{t.successDesc}</p>
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen grid lg:grid-cols-2 relative">
      {/* Left: Brand */}
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

          <Image
            src="/brand/logo/logo-white.png"
            alt="MotionHR"
            width={200}
            height={60}
            style={{ width: "auto", height: "auto" }}
            className="mb-8"
            priority
          />

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

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md">
          {/* Language toggle */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(ar ? "en" : "ar")}
              className="min-w-[60px] font-semibold"
            >
              {ar ? "EN" : "عربي"}
            </Button>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight mb-2">{t.title}</h2>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-primary" />
                {t.companyName} *
              </label>
              <Input
                required
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder={ar ? "مثال: شركة النور للتجارة" : "e.g. Al Noor Trading Co."}
                disabled={loading}
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <User className="w-4 h-4 text-brand-primary" />
                {t.ownerName} *
              </label>
              <Input
                required
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                placeholder={ar ? "الاسم الأول والأخير" : "First and last name"}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary" />
                {t.email} *
              </label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@company.com"
                dir="ltr"
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary" />
                {t.phone} *
              </label>
              <Input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
                dir="ltr"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-primary" />
                  {t.password} *
                </label>
                <Input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-primary" />
                  {t.confirmPass} *
                </label>
                <Input
                  required
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base gap-2 bg-brand-primary hover:bg-brand-secondary mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.creating}
                </>
              ) : (
                <>
                  {t.submit}
                  <ArrowLeft className={`w-4 h-4 ${ar ? "" : "rotate-180"}`} />
                </>
              )}
            </Button>
          </form>

          {/* Or WhatsApp */}
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