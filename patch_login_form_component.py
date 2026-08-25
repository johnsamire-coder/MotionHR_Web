import os

filePath = r'src/components/auth/login-form.tsx'
with open(filePath, 'r', encoding='utf-8') as f:
    content = f.read()

# إدراج Dialog والرموز وزر التفعيل
imports_anchor = 'import { Checkbox } from "@/components/ui/checkbox";'
extra_imports = '''import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UserCheck, Copy, Check, Phone, CreditCard, Lock } from "lucide-react";'''

if imports_anchor in content and 'DialogContent' not in content:
    content = content.replace(imports_anchor, extra_imports)

# إضافة State التفعيل جوة LoginForm
state_anchor = 'const [isLoading, setIsLoading] = useState(false);'
extra_state = '''const [isLoading, setIsLoading] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [nationalSuffix, setNationalSuffix] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [actStep, setActStep] = useState<1 | 2>(1);
  const [actUsername, setActUsername] = useState("");
  const [actLoading, setActLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
  };'''

if state_anchor in content and 'activateOpen' not in content:
    content = content.replace(state_anchor, extra_state)

# إضافة الزر والمودال تحت زر تسجيل الدخول
form_end_anchor = '</Button>\n    </form>'
extra_ui = '''</Button>

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
    </form>'''

if form_end_anchor in content:
    content = content.replace(form_end_anchor, extra_ui)

with open(filePath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ تم تحديث LoginForm الأصلي بنجاح!")
