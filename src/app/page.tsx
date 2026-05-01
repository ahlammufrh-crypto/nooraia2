import Link from "next/link";
import { Cpu, Zap, Shield, ArrowLeft, Monitor } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // User state is fetched but we no longer force redirects away from the homepage.
  // Users will navigate manually using the header/navigation links.

  const features = [
    { icon: <Monitor className="w-8 h-8 text-[#00FFFF]" />, title: "تأجير حواسيب كاملة", desc: "حواسيب متكاملة بأحدث معالجات الجيل الجديد" },
    { icon: <Cpu className="w-8 h-8 text-[#00FFFF]" />, title: "تأجير بطاقات رسومية", desc: "أقوى بطاقات RTX 4090 للعب بأقصى إعدادات" },
    { icon: <Shield className="w-8 h-8 text-[#00FFFF]" />, title: "أمان وخصوصية", desc: "بيئة منعزلة تماماً لكل مستخدم للحفاظ على الخصوصية" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative px-4 py-32 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden">
        {/* Dark (black) background with glowing deep/light blue circuit lines */}
        <div className="absolute inset-0 bg-[#000000] -z-20" />
        <div className="absolute inset-0 opacity-20 -z-10 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(26,43,76,0.5)_0%,transparent_70%)] -z-10" />
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 animate-slide-up" style={{ fontFamily: 'system-ui, sans-serif' }}>
          العب بأقصى <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#1A2B4C]">إعدادات</span>
        </h1>
        <p className="mt-4 text-xl text-[#E0E0E0] max-w-2xl mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          استأجر أقوى حواسيب الألعاب السحابية بالساعة وتمتع بتجربة لعب سلسة وبأعلى دقة، بدون الحاجة لشراء عتاد باهظ.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Link
            href="/marketplace"
            className="flex items-center justify-center px-8 py-4 bg-[#1A2B4C] hover:bg-[#00FFFF] text-white hover:text-black rounded-xl text-lg font-bold transition-all shadow-[0_0_20px_rgba(26,43,76,0.8)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]"
          >
            تصفح الأجهزة المتاحة
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="group relative p-8 rounded-2xl flex flex-col items-center text-center overflow-hidden bg-[#000000] border border-[#1A2B4C] hover:border-[#00FFFF] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#1A2B4C]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 rounded-2xl bg-[#1A2B4C]/20 flex items-center justify-center mb-6 border border-[#1A2B4C] group-hover:border-[#00FFFF]/50 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all relative">
                {/* Circuit-like accents on icon box */}
                <div className="absolute top-0 left-2 w-4 h-[1px] bg-[#00FFFF]/50" />
                <div className="absolute bottom-0 right-2 w-4 h-[1px] bg-[#00FFFF]/50" />
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'system-ui, sans-serif' }}>{feature.title}</h3>
              <p className="text-[#E0E0E0]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
