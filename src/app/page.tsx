"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLangStore } from "@/lib/stores/language";
import {
  ArrowLeft, Sparkles, Users, Clock, MapPin,
  BarChart3, Shield, CheckCircle2, Briefcase,
  Bell, DollarSign, FileSpreadsheet, GitBranch,
  MessageCircle, Mail, PlayCircle, Building2, Zap,
} from "lucide-react";

const WHATSAPP_URL = "https://wa.me/201501551593?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B%D8%8C%20%D8%B9%D8%A7%D9%8A%D8%B2%20%D8%A3%D8%B9%D8%B1%D9%81%20%D8%AA%D9%81%D8%A7%D8%B5%D9%8A%D9%84%20MotionHR";
const MAIL_URL  = "mailto:Jssolutions.eg@gmail.com";
const DEMO_URL  = "/signup";

export default function LandingPage() {
  const lang    = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const ar      = lang === "ar";
  const dir     = ar ? "rtl" : "ltr";

  const t = {
    badge:         ar ? "نظام واحد يربط التشغيل اليومي بالمرتبات والإدارة" : "One system connecting daily ops, payroll & management",
    h1a:           ar ? "من أول حضور الموظف" : "From employee check-in",
    h1b:           ar ? "لحد صافي المرتب" : "to net salary",
    h1c:           ar ? "كل تشغيل شركتك في مكان واحد" : "your entire company runs in one place",
    subtitle:      ar ? "MotionHR مش مجرد HR System. ده نظام تشغيل فعلي للشركة: حضور، طلبات، إجازات، مأموريات، فرق ميدانية، سياسات، مرتبات، وتقارير تنفيذية — في تجربة واحدة." : "MotionHR is not just an HR system. It's a real operations platform: attendance, requests, leaves, missions, field teams, policies, payroll, and executive reports — all in one.",
    cta1:          ar ? "اتكلم معايا على واتساب" : "Chat on WhatsApp",
    cta2:          ar ? "جرّب النسخة التجريبية" : "Try the Demo",
    check1:        ar ? "حضور + GPS + فرق ميدانية" : "Attendance + GPS + Field Teams",
    check2:        ar ? "مرتبات + بدلات + خصومات" : "Payroll + Allowances + Deductions",
    check3:        ar ? "موافقات المدير و HR" : "Manager & HR Approvals",
    check4:        ar ? "تصدير Excel / PDF" : "Excel / PDF Export",
    nav1:          ar ? "ليه MotionHR؟" : "Why MotionHR?",
    nav2:          ar ? "المميزات" : "Features",
    nav3:          ar ? "التجربة" : "Demo",
    nav4:          ar ? "تواصل" : "Contact",
    navDemo:       ar ? "جرّب النسخة" : "Try Demo",
    navCTA:        ar ? "احجز ديمو" : "Book Demo",
    floatWA:       ar ? "تواصل واتساب" : "WhatsApp Us",
    painTitle:     ar ? "لو عندك واحدة من المشاكل دي، MotionHR معمول لك" : "If you have any of these problems, MotionHR is built for you",
    painSub:       ar ? "إحنا بنحل الفجوة اللي بتحصل بين التشغيل اليومي، متابعة المدير، وسيطرة الإدارة على المرتبات والتقارير." : "We bridge the gap between daily operations, manager visibility, and HR control over payroll and reports.",
    featTitle:     ar ? "كل اللي تحتاجه لإدارة التشغيل اليومي" : "Everything you need to run daily operations",
    featSub:       ar ? "من أول حضور الموظف لحد تصدير كشف المرتبات — من غير لف ودوران." : "From employee check-in to payroll export — no detours.",
    portTitle:     ar ? "3 بوابات في نظام واحد" : "3 Portals in one system",
    portSub:       ar ? "كل دور في الشركة له تجربة مصممة له بالظبط." : "Every role has a tailored experience.",
    wfTitle:       ar ? "من أول اليوم لآخر الشهر" : "From day one to end of month",
    wfSub:         ar ? "MotionHR بيربط التشغيل الحقيقي للشركة في فلو واحد واضح." : "MotionHR connects your real operations in one clear flow.",
    demoReady:     ar ? "Demo Ready" : "Demo Ready",
    demoTitle:     ar ? "لو عايز تشوف النظام فعلاً، جرّبه أو كلمني الآن" : "Want to see MotionHR in action? Try it or contact us",
    demoSub:       ar ? "تقدر تدخل تشوف الواجهة، أو تبعتلي على واتساب وأرتب لك عرض مباشر." : "Explore the interface yourself or message us on WhatsApp for a live demo.",
    demo1Title:    ar ? "نسخة تجريبية" : "Try the Demo",
    demo1Desc:     ar ? "ادخل على النظام وشوف التدفقات الرئيسية." : "Access the system and explore the main flows.",
    demo1Btn:      ar ? "جرّب النسخة الآن" : "Try Now",
    demo2Title:    ar ? "عرض مباشر مع المطور" : "Live Demo with Developer",
    demo2Desc:     ar ? "لو عايز أعرفك على النظام حسب نشاط شركتك، ابعتلي على واتساب." : "Want a walkthrough tailored to your business? Message us on WhatsApp.",
    demo2Btn:      ar ? "احجز ديمو واتساب" : "Book WhatsApp Demo",
    contactTitle:  ar ? "جاهز تشوف MotionHR على شركتك؟" : "Ready to see MotionHR on your company?",
    contactSub:    ar ? "أسرع طريقة: ابعت رسالة واتساب، أو راسلنا على الإيميل، أو ادخل النسخة التجريبية." : "Fastest way: send a WhatsApp message, email us, or jump into the demo.",
    wa:            ar ? "واتساب مباشر" : "WhatsApp Direct",
    waDesc:        ar ? "أسرع قناة تواصل لو عايز رد سريع أو حجز ديمو." : "Fastest channel for quick answers or booking a demo.",
    mail:          ar ? "البريد الإلكتروني" : "Email Us",
    mailDesc:      ar ? "مناسب لو عايز تبعت تفاصيل شركتك أو طلب رسمي." : "Ideal for sending company details or formal requests.",
    demoCard:      ar ? "جرّب النظام" : "Try the System",
    demoCardDesc:  ar ? "ادخل على النسخة وشوف تجربة النظام بنفسك." : "Enter the demo and experience the system yourself.",
    footerBy:      ar ? "صمّم وطوّر بواسطة" : "Designed & Developed by",
    liveOverview:  ar ? "نظرة مباشرة على التشغيل" : "Live Operations Overview",
    portals3:      ar ? "بوابات النظام" : "System Portals",
    bookLive:      ar ? "احجز عرض مباشر" : "Book a Live Demo",
    waFastest:     ar ? "واتساب أسرع طريق للقرار" : "WhatsApp is the fastest way",
  };

  const painPoints = ar
    ? [
        "الحضور والانصراف لسه بيتراجع يدوي أو على إكسيل؟",
        "المرتبات بتاخد وقت طويل وفيها مراجعات كتير كل شهر؟",
        "طلبات الإجازات والأذونات مشتتة بين واتساب واتصالات؟",
        "الموظفين الميدانيين والمأموريات مش واضحة لحظة بلحظة؟",
      ]
    : [
        "Still tracking attendance manually or on Excel?",
        "Payroll taking too long with too many manual corrections?",
        "Leave and permission requests scattered across WhatsApp?",
        "Field employees and missions not visible in real time?",
      ];

  const features = [
    { icon: Clock,       title: ar?"حضور ذكي":"Smart Attendance",       desc: ar?"تسجيل حضور وانصراف، تأخير، إذونات، ومرونة للموظفين المكتبيين والميدانيين.":"Check-in/out, late tracking, permissions, and flexibility for office and field workers." },
    { icon: DollarSign,  title: ar?"تشغيل مرتبات فعلي":"Real Payroll Engine", desc: ar?"مرتبات شهرية، بدلات، خصومات، مكافآت، أوفرتايم، وتصدير Excel وPDF.":"Monthly payroll runs, allowances, deductions, bonuses, overtime, and Excel/PDF exports." },
    { icon: Briefcase,   title: ar?"مأموريات وزيارات ميدانية":"Missions & Field Visits", desc: ar?"إدارة المهمات، المواقع، الزيارات، والمتابعة الجغرافية للفرق الميدانية.":"Manage missions, locations, visits, and geo-tracking for field teams." },
    { icon: Bell,        title: ar?"طلبات وموافقات":"Requests & Approvals", desc: ar?"إجازات، طلبات، أذونات، واعتمادات المدير والموارد البشرية بسلاسة.":"Leaves, requests, permissions, and manager/HR approvals — clear and seamless." },
    { icon: GitBranch,   title: ar?"هيكل تنظيمي حي":"Live Org Chart",       desc: ar?"عرض هرمي للشركة، المديرين، الفرق، وسلسلة الإدارة بوضوح.":"Hierarchical view of company, managers, teams, and clear management chains." },
    { icon: Shield,      title: ar?"صلاحيات وأمان":"Roles & Security",      desc: ar?"أدوار واضحة: موظف، مدير، HR، وصاحب شركة — تحكم دقيق في كل شاشة.":"Clear roles: Employee, Manager, HR, and Owner — granular control over every screen." },
  ];

  const portals = [
    { title: ar?"بوابة الموظف":"Employee Portal",         sub:"Employee Portal", points: ar?["الحضور والانصراف","الإجازات والطلبات","المهام والزيارات","كشف المرتب"]:["Attendance & Check-in","Leaves & Requests","Missions & Visits","Payslip"],           color:"from-brand-primary/15 to-brand-accent/10" },
    { title: ar?"بوابة المدير":"Manager Portal",           sub:"Manager Portal",  points: ar?["اعتماد الطلبات","متابعة حضور الفريق","مهمات الفريق","مواقع مباشرة"]:["Approve Requests","Team Attendance","Team Missions","Live Locations"],              color:"from-brand-accent/15 to-brand-highlight/10" },
    { title: ar?"بوابة الموارد البشرية":"HR Portal",       sub:"HR Portal",       points: ar?["إدارة الموظفين","السياسات واللوائح","تشغيل المرتبات","التقارير"]:["Employee Management","Policies","Payroll Runs","Reports & Analytics"],               color:"from-brand-secondary/15 to-brand-primary/10" },
  ];

  const workflow = ar
    ? ["تسجيل حضور الموظف","اعتماد الطلبات","متابعة الزيارات والمأموريات","حساب المرتبات تلقائياً","تصدير Excel / PDF"]
    : ["Employee Check-in","Request Approvals","Visit & Mission Tracking","Auto Payroll Calculation","Export Excel / PDF"];

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">

      {/* Floating WhatsApp */}
      <Link href={WHATSAPP_URL} target="_blank"
        className={`fixed bottom-5 z-50 ${ar ? "left-5" : "right-5"}`}>
        <div className="flex items-center gap-3 rounded-full bg-green-500 text-white px-5 py-3 shadow-2xl hover:bg-green-600 transition-all hover:scale-[1.02]">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{t.floatWA}</span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/brand/icon/icon-gradient.png" alt="MotionHR"
                width={40} height={40} style={{width:"auto",height:"auto"}}
                className="rounded-lg" priority />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold tracking-tight">MotionHR</span>
                <span className="text-[10px] text-muted-foreground">Workforce Operating System</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {[[ar?"#why":"#why", t.nav1],["#features",t.nav2],["#demo",t.nav3],["#contact",t.nav4]].map(([href,label])=>(
                <Link key={href} href={href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition">{label}</Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"
                onClick={() => setLang(ar ? "en" : "ar")}
                className="min-w-[60px] font-semibold">
                {ar ? "EN" : "عربي"}
              </Button>
              <Link href={DEMO_URL}>
                <Button variant="ghost" size="sm">{t.navDemo}</Button>
              </Link>
              <Link href={WHATSAPP_URL} target="_blank">
                <Button size="sm" className="gap-2">
                  {t.navCTA}
                  <ArrowLeft className={`w-4 h-4 ${ar?"":"rotate-180"}`} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-1/2 translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-brand-primary/20 via-brand-accent/10 to-brand-highlight/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <div className={ar?"text-right":"text-left"}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 backdrop-blur px-4 py-1.5 text-sm mb-7">
                <Sparkles className="w-4 h-4 text-brand-accent" />
                <span className="text-muted-foreground">{t.badge}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-5">
                {t.h1a}<br />
                <span className="text-gradient">{t.h1b}</span><br />
                {t.h1c}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-8 mb-8 max-w-2xl">{t.subtitle}</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                <Link href={WHATSAPP_URL} target="_blank" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2 h-12 px-8 text-base">
                    {t.cta1}<MessageCircle className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href={DEMO_URL} className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full gap-2 h-12 px-8 text-base">
                    {t.cta2}<PlayCircle className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                {[t.check1,t.check2,t.check3,t.check4].map((item)=>(
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Board */}
            <div className="relative">
              <div className="rounded-3xl border border-border bg-card/70 backdrop-blur p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.liveOverview}</p>
                    <h3 className="text-xl font-bold">MotionHR Dashboard</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />Online
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    {icon:Users,       label:ar?"موظفين على النظام":"Employees on System", value:"250+", sub:"Employees"},
                    {icon:Clock,       label:ar?"تسجيلات حضور اليوم":"Today Check-ins",    value:"189",  sub:"Today"},
                    {icon:Bell,        label:ar?"طلبات تحتاج اعتماد":"Pending Approvals",  value:"27",   sub:"Pending"},
                    {icon:DollarSign,  label:ar?"تشغيل مرتبات + تصدير":"Payroll + Export", value:"Ready",sub:"Payroll"},
                  ].map(({icon:Icon,label,value,sub},i)=>(
                    <div key={i} className="rounded-2xl bg-muted/40 border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-5 h-5 text-brand-primary" />
                        <span className="text-xs text-muted-foreground">{sub}</span>
                      </div>
                      <div className="text-3xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{t.portals3}</h4>
                    <span className="text-xs text-muted-foreground">3 Portals</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      {name:"Employee Portal",desc:ar?"حضور · إجازات · طلبات · مهام":"Attendance · Leaves · Requests",color:"bg-brand-primary/10 text-brand-primary"},
                      {name:"Manager Portal", desc:ar?"اعتمادات · فريق · مهمات · مواقع":"Approvals · Team · Missions",  color:"bg-brand-accent/10 text-brand-accent"},
                      {name:"HR Portal",      desc:ar?"رواتب · تقارير · سياسات · إدارة":"Payroll · Reports · Policies", color:"bg-amber-500/10 text-amber-700"},
                    ].map((item)=>(
                      <div key={item.name} className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className={`text-xs px-3 py-1 rounded-full ${item.color}`}>Active</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={`absolute -bottom-5 ${ar?"-left-5":"-right-5"} hidden md:block rounded-2xl bg-white shadow-xl border border-border px-4 py-3`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.bookLive}</p>
                    <p className="text-xs text-muted-foreground">{t.waFastest}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain */}
      <section id="why" className="py-16 lg:py-24 border-y border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {t.painTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{t.painSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {painPoints.map((item)=>(
              <div key={item} className="rounded-2xl border border-border bg-card p-5 flex items-start gap-3 hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-base leading-8">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.featTitle}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.featSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f,i)=>(
              <div key={i} className="group rounded-2xl border border-border bg-card p-6 hover:border-brand-accent/40 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-accent/10 transition">
                  <f.icon className="w-6 h-6 text-brand-primary group-hover:text-brand-accent transition" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-7">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section className="py-20 lg:py-28 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.portTitle}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.portSub}</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {portals.map((portal)=>(
              <div key={portal.title} className={`rounded-3xl border border-border bg-gradient-to-br ${portal.color} p-6`}>
                <div className="mb-5">
                  <p className="text-sm text-muted-foreground">{portal.sub}</p>
                  <h3 className="text-2xl font-bold mt-1">{portal.title}</h3>
                </div>
                <div className="space-y-3">
                  {portal.points.map((point)=>(
                    <div key={point} className="rounded-xl border border-border/70 bg-background/80 px-4 py-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />
                      <span className="text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
            <div className="max-w-3xl mb-12">
              <h2 className="text-4xl font-bold tracking-tight mb-4">{t.wfTitle}</h2>
              <p className="text-lg text-muted-foreground leading-8">{t.wfSub}</p>
            </div>
            <div className="grid md:grid-cols-5 gap-4">
              {workflow.map((step,i)=>(
                <div key={step} className="rounded-2xl border border-border bg-background p-5">
                  <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold mb-4">{i+1}</div>
                  <p className="font-medium leading-7">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section id="demo" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 md:p-14">
            <div className="grid lg:grid-cols-2 gap-10 items-center relative z-10">
              <div className="text-white">
                <p className="text-sm uppercase tracking-[0.18em] text-white/70 mb-3">{t.demoReady}</p>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-5">{t.demoTitle}</h2>
                <p className="text-lg text-white/85 leading-8">{t.demoSub}</p>
              </div>
              <div className="rounded-3xl bg-white/10 border border-white/15 backdrop-blur p-6 text-white space-y-4">
                <div className="rounded-2xl bg-white/10 px-4 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <PlayCircle className="w-5 h-5" />
                    <p className="font-semibold">{t.demo1Title}</p>
                  </div>
                  <p className="text-sm text-white/80 leading-7">{t.demo1Desc}</p>
                  <Link href={DEMO_URL} className="inline-block mt-4">
                    <Button variant="secondary" className="gap-2">
                      {t.demo1Btn}<ArrowLeft className={`w-4 h-4 ${ar?"":"rotate-180"}`} />
                    </Button>
                  </Link>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="w-5 h-5" />
                    <p className="font-semibold">{t.demo2Title}</p>
                  </div>
                  <p className="text-sm text-white/80 leading-7">{t.demo2Desc}</p>
                  <Link href={WHATSAPP_URL} target="_blank" className="inline-block mt-4">
                    <Button variant="secondary" className="gap-2">
                      {t.demo2Btn}<ArrowLeft className={`w-4 h-4 ${ar?"":"rotate-180"}`} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 lg:py-28 bg-muted/20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.contactTitle}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.contactSub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <Link href={WHATSAPP_URL} target="_blank" className="rounded-3xl border border-border bg-card p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.wa}</h3>
              <p className="text-sm text-muted-foreground leading-7 mb-4">{t.waDesc}</p>
              <p dir="ltr" className="font-semibold">+20 01501551593</p>
            </Link>
            <Link href={MAIL_URL} className="rounded-3xl border border-border bg-card p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.mail}</h3>
              <p className="text-sm text-muted-foreground leading-7 mb-4">{t.mailDesc}</p>
              <p className="font-semibold break-all">Jssolutions.eg@gmail.com</p>
            </Link>
            <Link href={DEMO_URL} className="rounded-3xl border border-border bg-card p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-4">
                <PlayCircle className="w-6 h-6 text-brand-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.demoCard}</h3>
              <p className="text-sm text-muted-foreground leading-7 mb-4">{t.demoCardDesc}</p>
              <p className="font-semibold">Demo Access →</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/brand/icon/icon-gradient.png" alt="MotionHR"
                width={32} height={32} style={{width:"auto",height:"auto"}} className="rounded-lg" />
              <div className="text-sm text-muted-foreground">
                © 2026 MotionHR — {t.footerBy}{" "}
                <span className="font-semibold text-foreground">Eng/John Samir</span>
                {" "}/{" "}
                <span className="text-brand-primary font-semibold">JS Solutions</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
                <Building2 className="w-4 h-4" /><span>HR + Operations</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
                <FileSpreadsheet className="w-4 h-4" /><span>Excel / PDF</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
                <MapPin className="w-4 h-4" /><span>Field Ready</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}