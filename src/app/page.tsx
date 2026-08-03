import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Sparkles,
  Users,
  Clock,
  MapPin,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/icon/icon-gradient.png"
                alt="MotionHR"
                width={40}
                height={40}
                style={{ width: "auto", height: "auto" }}
                className="rounded-lg"
                priority
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight">MotionHR</span>
                <span className="text-[10px] text-muted-foreground -mt-1">
                  Workforce Platform
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                About
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-2">
                  Get Started
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-brand-primary/20 via-brand-accent/10 to-brand-highlight/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 backdrop-blur px-4 py-1.5 text-sm mb-8">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              <span className="text-muted-foreground">
                The Workforce Operating System
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Manage your team
              <br />
              <span className="text-gradient">smarter, not harder</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Complete HR platform for modern companies. Attendance, payroll,
              leaves, missions, and field operations — all in one beautiful place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2 h-12 px-8 text-base">
                  Start Free Trial
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base"
                >
                  Watch Demo
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for modern workforce management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-border bg-card p-6 hover:border-brand-accent/50 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-accent/10 transition">
                  <feature.icon className="w-6 h-6 text-brand-primary group-hover:text-brand-accent transition" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 md:p-16 text-center">
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to transform
                <br />
                your workforce?
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Join hundreds of companies already using MotionHR to streamline
                their operations
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 h-12 px-8 text-base"
                >
                  Start Free Trial
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/icon/icon-gradient.png"
                alt="MotionHR"
                width={32}
                height={32}
                style={{ width: "auto", height: "auto" }}
                className="rounded-lg"
              />
              <span className="text-sm text-muted-foreground">
                &copy; 2026 MotionHR. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground transition">
                Terms
              </Link>
              <Link href="#" className="hover:text-foreground transition">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Branding - Bottom Right (Global) */}
      <div className="fixed bottom-4 right-6 z-50 text-right leading-tight pointer-events-none">
        <div className="text-[11px] text-muted-foreground/70">
          Designed &amp; Developed by
        </div>
        <div className="text-xs font-semibold">
          <span className="text-foreground/80">Eng/John Samir</span>
          <span className="mx-1.5 text-muted-foreground/60">|</span>
          <span className="text-brand-primary">JS Solutions</span>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Clock,
    title: "Smart Attendance",
    description:
      "GPS-based check-in/out with geofencing, flexible shifts, and automatic tracking for office and field workers.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Organize employees by departments, branches, and reporting hierarchy with role-based access control.",
  },
  {
    icon: MapPin,
    title: "Field Operations",
    description:
      "Real-time location tracking, missions, field visits, and route management for mobile teams.",
  },
  {
    icon: BarChart3,
    title: "Powerful Reports",
    description:
      "12+ built-in reports for attendance, payroll, leaves, and productivity — exportable to PDF and Excel.",
  },
  {
    icon: Zap,
    title: "Payroll Engine",
    description:
      "Automated salary calculations with allowances, deductions, overtime, and full compliance support.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Multi-tenant architecture, encrypted data, audit logs, and granular permissions for full control.",
  },
];
