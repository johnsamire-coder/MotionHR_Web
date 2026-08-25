import os

login_path = r'src/app/login/page.tsx'

login_component_code = '''"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserCheck, Copy, Check, Lock, Phone, CreditCard, ShieldCheck } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants/config";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Activation Dialog State
  const [activateOpen, setActivateOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [nationalSuffix, setNationalSuffix] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [actStep, setActStep] = useState<1 | 2>(1);
  const [actUsername, setActUsername] = useState("");
  const [actLoading, setActLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mobile/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(STORAGE_KEYS.token, data.token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user || { username }));
        toast.success("تم تسجيل الدخول بنجاح! 🎉");
        router.push("/hr/dashboard");
      } else {
        toast.error(data.message || data.error || "بيانات الدخول غير صحيحة");
      }
    } catch (err) {
      toast.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIdentity = async () => {
    if (!phone.trim() || !nationalSuffix.trim()) {
      toast.error("يرجى إدخال رقم الموبايل وآخر 4 أرقام من القومي");
      return;
    }
    setActLoading(true);
    try {
      const res = await fetch("/api/mobile/activate-account/", {
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
      const res = await fetch("/api/mobile/activate-account/", {
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
        setUsername(actUsername || data.username || "");
        setActivateOpen(false);
        // Reset modal state
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

  const copyToClipboard = () => {
    if (actUsername) {
      navigator.clipboard.writeText(actUsername);
      setCopied(true);
      toast.success("تم نسخ اسم المستخدم! 📋");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 dir-rtl">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="h-10 w-10 text-brand-accent" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">MotionHR</h2>
          <p className="mt-2 text-sm text-slate-400">منصة إدارة الموارد البشرية والعمليات</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-200 block mb-1">اسم المستخدم / الإيميل</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                placeholder="أدخل اسم المستخدم"
              />
            </div>
            <div>
              <Label className="text-slate-200 block mb-1">كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                placeholder="أدخل كلمة المرور"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-accent text-slate-950 font-bold hover:bg-emerald-400 rounded-xl transition"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </Button>

          <div className="pt-4 border-t border-slate-700 text-center">
            <button
              type="button"
              onClick={() => {
                setActStep(1);
                setActivateOpen(true);
              }}
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>تسجيل لأول مرة / تفعيل الحساب</span>
            </button>
          </div>
        </form>
      </div>

      {/* Activation Modal Dialog */}
      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-400">
              <UserCheck className="w-6 h-6" />
              <span>تفعيل الحساب لأول مرة</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              أدخل بياناتك المسجلة بالشركة لتفعيل حسابك وتعيين كلمة المرور
            </DialogDescription>
          </DialogHeader>

          {actStep === 1 ? (
            <div className="space-y-4 py-3">
              <div>
                <Label className="text-slate-200 text-xs mb-1 block">رقم الموبايل</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-200 text-xs mb-1 block">آخر 4 أرقام من الرقم القومي</Label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="text"
                    maxLength={4}
                    value={nationalSuffix}
                    onChange={(e) => setNationalSuffix(e.target.value)}
                    placeholder="مثال: 1234"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-3">
              <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                <span className="text-xs text-slate-400 block">اسم المستخدم الخاص بك هو:</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-emerald-300 font-mono select-all">
                    {actUsername}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={copyToClipboard}
                    className="h-8 px-2 text-slate-300 hover:text-white hover:bg-slate-700"
                    title="نسخ اسم المستخدم"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs mr-1">{copied ? "تم النسخ" : "نسخ"}</span>
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-slate-200 text-xs mb-1 block">تعيين كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور (8 رموز على الأقل)"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setActivateOpen(false)}
              disabled={actLoading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              إلغاء
            </Button>
            {actStep === 1 ? (
              <Button
                onClick={handleVerifyIdentity}
                disabled={actLoading}
                className="bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
              >
                {actLoading ? "جاري التحقق..." : "التحقق من هويتي"}
              </Button>
            ) : (
              <Button
                onClick={handleActivateAccount}
                disabled={actLoading}
                className="bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
              >
                {actLoading ? "جاري التفعيل..." : "تفعيل الحساب والبدء"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'''

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_component_code)

print("✅ تم زرع شاشة الدخول ومودال 'تسجيل لأول مرة' بنجاح بالكامل!")
