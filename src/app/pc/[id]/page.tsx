import Link from "next/link";
import { Cpu, Zap, Activity, HardDrive, Wifi, ArrowRight, MessageCircle, Star, Send, Terminal, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RentButton from "@/components/RentButton";

export default async function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: device, error } = await supabase
    .from("devices")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (error || !device) {
    return notFound();
  }
  
  const isFullPC = device.type === "pc";
  const typeLabel = isFullPC ? "جهاز كامل" : "بطاقة رسوميات";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/marketplace" className="inline-flex items-center text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowRight className="w-4 h-4 ml-2" />
        العودة للسوق
      </Link>

      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{device.name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400">{device.status === 'available' ? 'متاح الآن' : 'مشغول'}</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary-glow border border-primary/20">{typeLabel}</span>
            </div>
            
            <div className="flex items-center mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <span className="text-zinc-400 text-sm ml-2 mr-2">4.9 (124 تقييم)</span>
            </div>

            <p className="text-zinc-400 mb-8">
              {isFullPC 
                ? "جهاز ألعاب كامل فائق الأداء مجهز للبث بزمن انتقال منخفض للغاية." 
                : "بيئة معزولة مخصصة لمعالجة البيانات والذكاء الاصطناعي مع وصول كامل للجذور (Root)."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="text-xs text-zinc-500 mb-1">بطاقة الرسوميات</div>
                  <div className="font-semibold">{device.gpu}</div>
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="text-xs text-zinc-500 mb-1">المعالج</div>
                  <div className="font-semibold">{device.cpu}</div>
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                <Activity className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="text-xs text-zinc-500 mb-1">الذاكرة العشوائية</div>
                  <div className="font-semibold">{device.ram}</div>
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="text-xs text-zinc-500 mb-1">التخزين</div>
                  <div className="font-semibold">{device.storage}</div>
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                <Wifi className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <div className="text-xs text-zinc-500 mb-1">الشبكة</div>
                  <div className="font-semibold">10 Gbps اتصال مباشر</div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 flex-shrink-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <div className="text-sm text-zinc-400 mb-2">السعر الإجمالي</div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">{device.hourly_price} ﷼</span>
                <span className="text-zinc-500"> / ساعة</span>
              </div>
              
              <RentButton price={device.hourly_price.toString()} deviceId={device.id} />

              {/* Streaming or SSH Logic */}
              <div className="mt-6 pt-6 border-t border-zinc-800/50 text-right">
                {isFullPC ? (
                  <>
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-primary" /> البث السحابي (Sunshine)
                    </h4>
                    <p className="text-xs text-zinc-400 mb-4">يعتمد هذا الجهاز على بروتوكول Sunshine/Moonlight لتوفير بث 4K بزمن انتقال منخفض للألعاب.</p>
                  </>
                ) : (
                  <>
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-primary" /> اتصال SSH (Docker)
                    </h4>
                    <p className="text-xs text-zinc-400 mb-4">يتم توفير بيئة Docker معزولة عبر نفق Tailscale آمن للتحكم المباشر عبر SSH و VS Code.</p>
                    <div className="bg-black/50 p-3 rounded border border-zinc-800 text-left mb-4">
                      <code className="text-xs text-zinc-300 font-mono block">ssh user@100.x.y.z -p 2222</code>
                    </div>
                    <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                      عرض بيانات الاتصال
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chat System */}
        <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="text-primary-glow" /> محادثة المالك
          </h2>
          <div className="flex-1 bg-zinc-900/50 rounded-xl p-4 overflow-y-auto mb-4 border border-zinc-800 flex flex-col gap-3">
            <div className="bg-zinc-800 p-3 rounded-lg rounded-br-none self-end max-w-[80%]">
              <p className="text-sm text-white">مرحباً! هل الجهاز جاهز لتشغيل مودات Cyberpunk؟</p>
              <span className="text-[10px] text-zinc-400 mt-1 block">10:30 ص</span>
            </div>
            <div className="bg-primary/20 border border-primary/30 p-3 rounded-lg rounded-bl-none self-start max-w-[80%]">
              <p className="text-sm text-white">أهلاً بك. نعم، الجهاز مُحدث بآخر التعريفات ومثبت عليه اللعبة.</p>
              <span className="text-[10px] text-zinc-400 mt-1 block">10:32 ص</span>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="اكتب رسالة..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary" />
            <button className="p-3 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" /> التقييمات والمراجعات
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div className="border-b border-zinc-800/50 pb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-white">أحمد خ.</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-400">أداء ممتاز جداً، لا يوجد أي تقطيع في البث.</p>
            </div>
            <div className="border-b border-zinc-800/50 pb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-white">سعد ال.</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${s === 5 ? 'text-zinc-600' : 'text-yellow-500 fill-yellow-500'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-400">جهاز رائع، لكن واجهت مشكلة بسيطة في البداية.</p>
            </div>
            <div className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-white">فارس س.</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-400">سرعة اتصال خيالية! استخدمته لتدريب موديل ذكاء اصطناعي وكان الأداء مبهراً.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
