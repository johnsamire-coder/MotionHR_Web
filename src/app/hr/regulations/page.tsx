"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ScrollText, Save, Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface CharterData {
  has_charter: boolean;
  charter?: {
    id: number;
    title: string;
    introduction: string;
    content: string;
    version: number;
    is_mandatory: boolean;
    attachment_url?: string;
    attachment_name?: string;
  };
}

interface Acceptance {
  employee_id: number;
  employee_name: string;
  employee_code: string;
  accepted: boolean;
  accepted_at?: string;
}

export default function HRRegulationsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [charterData, setCharterData] = useState<CharterData | null>(null);
  const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "acceptances">("content");

  const [title, setTitle] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [content, setContent] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [charRes, accRes] = await Promise.all([
        fetch("/api/hr/charter", { headers: { Authorization: authH } }),
        fetch("/api/hr/charter/acceptances", { headers: { Authorization: authH } }),
      ]);
      const [charData, accData] = await Promise.all([charRes.json(), accRes.json()]);
      setCharterData(charData);
      if (charData?.charter) {
        setTitle(charData.charter.title || "");
        setIntroduction(charData.charter.introduction || "");
        setContent(charData.charter.content || "");
        setIsMandatory(charData.charter.is_mandatory ?? true);
      }
      setAcceptances(accData?.employees || accData?.acceptances || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const saveCharter = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error(ar ? "العنوان والمحتوى مطلوبان" : "Title and content required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/charter/update", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ title, introduction, content, is_mandatory: isMandatory }),
      });
      const data = await res.json();
      if (data.success || data.version) {
        toast.success(ar ? "تم حفظ اللائحة" : "Regulations saved");
        loadAll();
      } else {
        toast.error(data.error || (ar ? "فشل الحفظ" : "Save failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const acceptedCount = acceptances.filter(a => a.accepted).length;
  const totalCount = acceptances.length;

  return (
    <div className="space-y-6 pb-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "إدارة لائحة الشركة" : "Company Regulations Management"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "تحرير اللائحة ومتابعة موافقات الموظفين" : "Edit regulations and track employee acceptances"}
        </p>
      </div>

      {/* Stats */}
      {!loading && charterData?.has_charter && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 bg-white text-center">
            <p className="text-2xl font-bold text-purple-600">{charterData.charter?.version || 1}</p>
            <p className="text-xs text-muted-foreground mt-1">{ar ? "رقم الإصدار" : "Version"}</p>
          </div>
          <div className="border rounded-xl p-4 bg-white text-center">
            <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{ar ? "وافقوا" : "Accepted"}</p>
          </div>
          <div className="border rounded-xl p-4 bg-white text-center">
            <p className="text-2xl font-bold text-amber-600">{totalCount - acceptedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{ar ? "لم يوافقوا" : "Pending"}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["content", "acceptances"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "content"
              ? (ar ? "محتوى اللائحة" : "Regulations Content")
              : (ar ? `الموافقات (${acceptedCount}/${totalCount})` : `Acceptances (${acceptedCount}/${totalCount})`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {activeTab === "content" && (
            <div className="space-y-4">
              <div className="border rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ScrollText className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">{ar ? "تعديل اللائحة" : "Edit Regulations"}</h2>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">{ar ? "عنوان اللائحة *" : "Title *"}</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={ar ? "مثال: لائحة الشركة 2026" : "e.g. Company Regulations 2026"}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">{ar ? "المقدمة" : "Introduction"}</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[80px] text-sm"
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    placeholder={ar ? "مقدمة اللائحة..." : "Introduction..."}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">{ar ? "محتوى اللائحة *" : "Content *"}</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[300px] text-sm font-mono"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={ar ? "اكتب محتوى اللائحة هنا..." : "Write regulations content here..."}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                  />
                  {ar ? "الموافقة إلزامية للموظفين" : "Acceptance is mandatory for employees"}
                </label>

                <div className="flex justify-end pt-2 border-t">
                  <button
                    onClick={saveCharter}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {ar ? "حفظ اللائحة" : "Save Regulations"}
                  </button>
                </div>
              </div>

              {charterData?.charter?.attachment_url && (
                <div className="border rounded-xl p-4 bg-white">
                  <p className="text-sm font-medium mb-2">{ar ? "الملف المرفق" : "Attachment"}</p>
                  <a
                    href={charterData.charter.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <ScrollText className="w-4 h-4" />
                    {charterData.charter.attachment_name || (ar ? "تحميل الملف" : "Download File")}
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === "acceptances" && (
            <div className="space-y-3">
              {acceptances.length === 0 ? (
                <div className="text-center py-16 border rounded-xl bg-white">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">{ar ? "لا توجد بيانات قبول" : "No acceptance data"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {acceptances.map((a) => (
                    <div key={a.employee_id} className={`border rounded-xl p-4 bg-white flex items-center justify-between gap-3 ${a.accepted ? "border-emerald-200" : "border-amber-200"}`}>
                      <div>
                        <p className="font-semibold text-sm">{a.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{a.employee_code}</p>
                        {a.accepted_at && (
                          <p className="text-xs text-muted-foreground mt-1">{a.accepted_at}</p>
                        )}
                      </div>
                      {a.accepted
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        : <XCircle className="w-5 h-5 text-amber-500 shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
