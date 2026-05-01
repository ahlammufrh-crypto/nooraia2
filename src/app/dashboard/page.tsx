import { Activity, Clock, Server, Play, Square, MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!userData || !userData.role) {
    redirect("/login/role");
  }

  if (userData.role === 'lender') {
    redirect("/lender-dashboard");
  }

  // Fetch active bookings for the user
  const { data: activeBookings } = await supabase
    .from('bookings')
    .select('*, devices(*)')
    .eq('user_id', user.id)
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center neon-border">
            <Activity className="text-primary-glow" />
          </div>
          <div>
            <div className="text-sm text-zinc-400 mb-1">الرصيد المتاح</div>
            <div className="text-2xl font-bold">45.50 ﷼</div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/30">
            <Clock className="text-accent" />
          </div>
          <div>
            <div className="text-sm text-zinc-400 mb-1">ساعات اللعب (هذا الشهر)</div>
            <div className="text-2xl font-bold">12.5 ساعة</div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30">
            <Server className="text-green-400" />
          </div>
          <div>
            <div className="text-sm text-zinc-400 mb-1">الأجهزة النشطة</div>
            <div className="text-2xl font-bold">1</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6">الجلسات النشطة</h2>
      
      {activeBookings && activeBookings.length > 0 ? (
        activeBookings.map((booking: any) => (
          <div key={booking.id} className="glass-panel rounded-2xl overflow-hidden mb-6">
            <div className="p-6 border-b border-zinc-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white">{booking.devices?.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 flex items-center gap-1.5 border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    {booking.status === 'active' ? 'قيد التشغيل' : 'معلق'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary-glow border border-primary/20">
                    {booking.devices?.type === 'pc' ? 'جهاز كامل' : 'بطاقة رسوميات'}
                  </span>
                </div>
                <div className="text-sm text-zinc-400">
                  يبدأ: {new Date(booking.start_time).toLocaleString('ar-SA')} | ينتهي: {new Date(booking.end_time).toLocaleString('ar-SA')}
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Link 
                  href={`/dashboard/devices/${booking.id}`}
                  className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                >
                  <Play className="w-4 h-4 ml-2" />
                  لوحة التحكم والاتصال
                </Link>
              </div>
            </div>
            <div className="bg-zinc-900/50 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-zinc-500 mb-1">المعالج</div>
                <div className="font-semibold truncate">{booking.devices?.cpu}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">الرام</div>
                <div className="font-semibold">{booking.devices?.ram}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">كرت الشاشة</div>
                <div className="font-semibold text-primary-glow truncate">{booking.devices?.gpu}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">التكلفة</div>
                <div className="font-semibold text-green-400">{booking.total_price} ﷼</div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="glass-panel p-8 rounded-2xl text-center mb-10 border border-dashed border-zinc-800">
          <Server className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">لا توجد جلسات نشطة</h3>
          <p className="text-zinc-500 text-sm">قم باستئجار جهاز من السوق للبدء.</p>
        </div>
      )}

      <h2 className="text-xl font-bold mb-6">الرسائل</h2>
      <div className="glass-panel rounded-2xl overflow-hidden mb-10 h-[400px] flex">
        <div className="w-1/3 border-l border-zinc-800/50 flex flex-col">
          <div className="p-4 border-b border-zinc-800/50 font-bold flex items-center gap-2">
            <MessageCircle className="text-primary-glow" /> المحادثات
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-zinc-800/50 bg-zinc-800/30 cursor-pointer transition-colors">
              <div className="font-bold text-white text-sm mb-1">مالك Alpha RTX 4090</div>
              <div className="text-xs text-zinc-400 truncate">أهلاً بك. نعم، الجهاز مُحدث بآخر التعريفات ومثبت عليه اللعبة.</div>
            </div>
            <div className="p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors">
              <div className="font-bold text-white text-sm mb-1">مالك Beta RTX 4080</div>
              <div className="text-xs text-zinc-400 truncate">تستطيع التواصل معي في أي وقت لو واجهت مشكلة.</div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-zinc-900/30">
          <div className="p-4 border-b border-zinc-800/50 font-bold text-white text-sm">
            مالك Alpha RTX 4090
          </div>
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            <div className="bg-zinc-800 p-3 rounded-lg rounded-br-none self-end max-w-[80%]">
              <p className="text-sm text-white">مرحباً! هل الجهاز جاهز لتشغيل مودات Cyberpunk؟</p>
              <span className="text-[10px] text-zinc-400 mt-1 block">10:30 ص</span>
            </div>
            <div className="bg-primary/20 border border-primary/30 p-3 rounded-lg rounded-bl-none self-start max-w-[80%]">
              <p className="text-sm text-white">أهلاً بك. نعم، الجهاز مُحدث بآخر التعريفات ومثبت عليه اللعبة.</p>
              <span className="text-[10px] text-zinc-400 mt-1 block">10:32 ص</span>
            </div>
          </div>
          <div className="p-4 border-t border-zinc-800/50 flex gap-2">
            <input type="text" placeholder="اكتب رسالة..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary" />
            <button className="p-3 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
