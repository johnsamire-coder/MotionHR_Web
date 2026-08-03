"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Upload, Download, FileSpreadsheet, Loader2,
  CheckCircle2, XCircle, AlertCircle, Users, Shield, FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  errors: number;
  error_details?: { row: number; errors: string[] }[];
}

export default function ImportPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext || "")) {
      toast.error(d.selectExcel);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error(d.fileTooLarge);
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const downloadTemplate = async () => {
    try {
      const res = await fetch("/api/employees/template", {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employee_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(d.templateDownloaded);
    } catch {
      toast.error(d.templateFailed);
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 90));
    }, 500);

    try {
      const res = await fetch("/api/employees/import", {
        method: "POST",
        headers: { Authorization: authHeader },
        body: formData,
        signal: AbortSignal.timeout(300000),
      });

      clearInterval(interval);
      setProgress(100);

      const data = await res.json();
      setResult(data);

      if (data.success || data.created > 0) {
        toast.success(
          `${d.importSuccess}: ${data.created || 0} ${d.newEmployees} | ${data.updated || 0} ${d.updatedEmployees}`
        );
      } else {
        toast.error(data.message || d.importFailed);
      }
    } catch {
      clearInterval(interval);
      setResult({
        success: false,
        message: d.serverError,
        created: 0,
        updated: 0,
        errors: 1,
      });
      toast.error(d.serverError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.importTitle}</h1>
        <p className="text-muted-foreground mt-1">{d.importDesc}</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{d.upTo500}</p>
              <p className="text-xs text-muted-foreground">{d.perBatch}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{d.fields67}</p>
              <p className="text-xs text-muted-foreground">{d.comprehensiveData}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{d.autoValidation}</p>
              <p className="text-xs text-muted-foreground">{d.validationDesc}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{d.uploadFile}</h3>
                <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                  <Download className="w-4 h-4" />
                  {d.downloadTemplate}
                </Button>
              </div>

              {/* Drop Zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                  ${dragOver
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-border hover:border-brand-primary/50 hover:bg-muted/30"
                  }
                `}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-semibold mb-1">{d.dragDrop}</p>
                <p className="text-sm text-muted-foreground mb-3">{d.orClick}</p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>XLSX / XLS</span>
                  <span>{d.maxSize}</span>
                </div>
              </div>

              {/* Selected File */}
              {file && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} {d.kb}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="gap-2 bg-brand-primary hover:bg-brand-primary/90"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{d.uploading}</>
                    ) : (
                      <><Upload className="w-4 h-4" />{d.startImport}</>
                    )}
                  </Button>
                </div>
              )}

              {/* Progress */}
              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">{progress}%</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="mt-6 space-y-4">
                  <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    result.success || result.created > 0
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-red-500/10 text-red-700"
                  }`}>
                    {result.success || result.created > 0
                      ? <CheckCircle2 className="w-5 h-5" />
                      : <XCircle className="w-5 h-5" />
                    }
                    <span className="font-semibold">
                      {result.success || result.created > 0 ? d.importSuccess : d.importFailed}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-emerald-200">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{result.created}</p>
                        <p className="text-xs text-muted-foreground">{d.newEmployees}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-200">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                        <p className="text-xs text-muted-foreground">{d.updatedEmployees}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                        <p className="text-xs text-muted-foreground">{d.errors}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {result.error_details && result.error_details.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          {d.errorDetails}
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {result.error_details.map((err, i) => (
                            <div key={i} className="text-sm p-2 bg-red-500/5 rounded">
                              <span className="font-semibold">{d.row} {err.row}:</span>{" "}
                              {err.errors.join(" | ")}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{d.importInstructions}</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-sm">{d.step1}</p>
                    <p className="text-xs text-muted-foreground">{d.step1Desc}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-sm">{d.step2}</p>
                    <p className="text-xs text-muted-foreground">{d.step2Desc}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-sm">{d.step3}</p>
                    <p className="text-xs text-muted-foreground">{d.step3Desc}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">{d.importNotes}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 mt-0.5 text-brand-primary flex-shrink-0" />
                  {d.note1}
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 mt-0.5 text-brand-primary flex-shrink-0" />
                  {d.note2}
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 mt-0.5 text-brand-primary flex-shrink-0" />
                  {d.note3}
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 mt-0.5 text-brand-primary flex-shrink-0" />
                  {d.note4}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
