import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <div className="hidden lg:flex relative overflow-hidden gradient-brand items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-brand-accent/40 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-brand-highlight/30 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md text-white">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition mb-12">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
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
            نظام تشغيل
            <br />
            القوى العاملة
          </h1>

          <p className="text-lg text-white/80 mb-8">
            كل احتياجات الموارد البشرية في مكان واحد
          </p>

          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <div className="text-3xl font-bold mb-1">10x</div>
              <div className="text-sm text-white/70">أسرع في الإدارة</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <div className="text-3xl font-bold mb-1">99%</div>
              <div className="text-sm text-white/70">دقة الحسابات</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              مرحباً بعودتك
            </h2>
            <p className="text-muted-foreground">
              سجل دخول لحسابك للمتابعة
            </p>
          </div>

          <LoginForm />
        </div>
      </div>

      <div className="absolute bottom-4 right-6 z-20 text-right leading-tight">
        <div className="text-[11px] text-muted-foreground">
          Designed &amp; Developed by
        </div>
        <div className="text-xs font-semibold">
          <span className="text-foreground">Eng/John Samir</span>
          <span className="mx-1.5 text-muted-foreground">|</span>
          <span className="text-brand-primary">JS Solutions</span>
        </div>
      </div>
    </div>
  );
}
