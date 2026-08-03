"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Info,
  Users,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/lib/stores/auth";

interface ImportResult {
  success: boolean;
  message?: string;
  created?: number;
  updated?: number;
  errors_count?: number;
  errors?: string[];
}

export default function ImportEmployeesPage() {
  const { token } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const validExtensions = [".xlsx", ".xls"];
    const isValid = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!isValid) {
      toast.error("يجب اختيار ملف Excel (.xlsx أو .xls)");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 10 ميجا)");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const downloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/employees/template", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) throw new Error("فشل التحميل");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employee_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("تم تحميل النموذج بنجاح");
    } catch {
      toast.error("فشل تحميل النموذج");
    } finally {
      setIsDownloading(false);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => (p < 90 ? p + 5 : p));
      }, 200);

      const response = await fetch("/api/employees/import", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success(
          `تم بنجاح: ${data.created || 0} جديد | ${data.updated || 0} تحديث`
        );
      } else {
        toast.error(data.message || "فشل الاستيراد");
      }
    } catch {
      toast.error("خطأ في رفع الملف");
      setResult({
        success: false,
        message: "خطأ في الاتصال بالسيرفر",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          استيراد الموظفين
        </h1>
        <p className="text-muted-foreground mt-1">
          ارفع ملف Excel لإضافة أو تحديث موظفين بالجملة
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          icon={Users}
          title="حتى 500 موظف"
          description="في المرة الواحدة"
          color="text-blue-600 bg-blue-500/10"
        />
        <InfoCard
          icon={FileText}
          title="67 حقل"
          description="بيانات شاملة لكل موظف"
          color="text-brand-accent bg-brand-accent/10"
        />
        <InfoCard
          icon={Sparkles}
          title="تحقق تلقائي"
          description="من صحة البيانات قبل الحفظ"
          color="text-brand-highlight bg-brand-highlight/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">رفع الملف</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  disabled={isDownloading}
                  className="gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  تحميل النموذج
                </Button>
              </div>

              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                    ${
                      dragActive
                        ? "border-brand-accent bg-brand-accent/5 scale-[1.02]"
                        : "border-border hover:border-brand-primary hover:bg-muted/30"
                    }
                  `}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold mb-1">
                        اسحب وأفلت الملف هنا
                      </p>
                      <p className="text-sm text-muted-foreground">
                        أو اضغط للاختيار من الجهاز
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>.xlsx, .xls</span>
                      <span>•</span>
                      <span>حد أقصى 10 ميجا</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-muted/30">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} كيلوبايت
                      </p>
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          جارِ الرفع...
                        </span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {/* Actions */}
                  {!isUploading && !result && (
                    <Button
                      onClick={uploadFile}
                      className="w-full h-11 gap-2"
                      size="lg"
                    >
                      <Upload className="w-4 h-4" />
                      بدء الاستيراد
                    </Button>
                  )}

                  {/* Results */}
                  {result && (
                    <div
                      className={`
                        rounded-xl border p-4
                        ${
                          result.success
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                            : "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold mb-2">
                            {result.success
                              ? "تم الاستيراد بنجاح"
                              : "فشل الاستيراد"}
                          </p>
                          {result.success && (
                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                                <div className="text-2xl font-bold text-emerald-600">
                                  {result.created || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  موظف جديد
                                </div>
                              </div>
                              <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                  {result.updated || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  تحديث
                                </div>
                              </div>
                              <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">
                                  {result.errors_count || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  أخطاء
                                </div>
                              </div>
                            </div>
                          )}
                          {result.message && (
                            <p className="text-sm mt-2">{result.message}</p>
                          )}
                          {result.errors && result.errors.length > 0 && (
                            <details className="mt-3">
                              <summary className="text-sm font-medium cursor-pointer">
                                عرض الأخطاء ({result.errors.length})
                              </summary>
                              <div className="mt-2 space-y-1 max-h-64 overflow-y-auto text-sm">
                                {result.errors.map((err, i) => (
                                  <div
                                    key={i}
                                    className="p-2 bg-white/50 dark:bg-white/5 rounded"
                                  >
                                    {err}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {result && (
                    <Button
                      variant="outline"
                      onClick={removeFile}
                      className="w-full gap-2"
                    >
                      رفع ملف آخر
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions Sidebar */}
        <div className="space-y-4">
          <Card className="border-brand-accent/30 bg-brand-accent/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Info className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    قبل ما تبدأ
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    حمّل النموذج، املأه بالبيانات، وارجع ارفعه هنا
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm mb-4">خطوات الاستيراد</h4>
              <div className="space-y-4">
                <Step number={1} title="حمّل النموذج" description="ملف Excel جاهز بكل الأعمدة" />
                <Step number={2} title="املأ البيانات" description="اتبع التعليمات في الشيت" />
                <Step number={3} title="ارفع الملف" description="النظام هيتحقق ويستورد" />
                <Step number={4} title="راجع النتائج" description="شوف اللي نجح واللي فيه أخطاء" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm mb-3">حقول إجبارية</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>• الاسم الأول والأخير (عربي)</div>
                <div>• الرقم القومي</div>
                <div>• رقم الموبايل</div>
                <div>• تاريخ الميلاد</div>
                <div>• تاريخ التعيين</div>
                <div>• الفرع والقسم</div>
                <div>• المسمى الوظيفي</div>
                <div>• تصنيف الموظف</div>
                <div>• طريقة القبض</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </div>
  );
}
