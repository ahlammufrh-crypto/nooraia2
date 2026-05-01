import Link from "next/link";
import { PlusCircle, Activity, DollarSign, Calendar, MessageSquare, Monitor, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LenderDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!userData || !userData.role) {
    redirect('/login/role');
  }

  if (userData.role !== 'lender') {
    redirect('/dashboard');
  }

  // Fetch real devices
  const { data: devicesData = [] } = await supabase
    .from('devices')
    .select('*')
    .eq('lender_id', user.id);

  const deviceIds = devicesData?.map(d => d.id) || [];

  // Fetch real earnings from wallet
  let totalEarnings = 0;
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single();
  
  if (wallet) {
    totalEarnings = Number(wallet.balance);
  }

  // Fetch active bookings
  let activeBookingsCount = 0;
  if (deviceIds.length > 0) {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('device_id', deviceIds)
      .eq('status', 'active');
    activeBookingsCount = count || 0;
  }

  // Fetch per-device earnings and stats
  const devicesWithStats = await Promise.all((devicesData || []).map(async (device) => {
    const { data: devicePayments } = await supabase
      .from('payments')
      .select('lender_payout')
      .in('booking_id', (
        await supabase
          .from('bookings')
          .select('id')
          .eq('device_id', device.id)
      ).data?.map(b => b.id) || []);
    
    const deviceEarnings = devicePayments?.reduce((sum, p) => sum + Number(p.lender_payout), 0) || 0;

    // Fetch active session info if device is in-use
    let sessionTime = "N/A";
    if (device.status === 'in-use') {
      const { data: activeBooking } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('device_id', device.id)
        .eq('status', 'active')
        .single();
      
      if (activeBooking) {
        const start = new Date(activeBooking.start_time).getTime();
        const now = new Date().getTime();
        const diffMs = now - start;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        sessionTime = `${diffHrs}h ${diffMins}m`;
      }
    }

    return { ...device, earnings: deviceEarnings, sessionTime };
  }));

  // Stats for the UI
  const stats = [
    { id: 1, name: "إجمالي الأرباح", value: `SAR ${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
    { id: 2, name: "الحجوزات النشطة", value: activeBookingsCount.toString(), icon: Calendar, color: "text-primary-glow" },
    { id: 3, name: "الأجهزة المتاحة", value: (devicesData?.filter(d => d.status === 'available').length || 0).toString(), icon: Monitor, color: "text-yellow-500" },
    { id: 4, name: "ساعات التشغيل", value: "0h", icon: Activity, color: "text-purple-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">لوحة تحكم المؤجر</h1>
          <p className="text-zinc-400">إدارة أجهزتك ومتابعة أرباحك في مكان واحد</p>
        </div>
        <div className="flex gap-4">
          <Link
            prefetch={true}
            href="/lender-dashboard/withdraw"
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl text-sm font-bold transition-all border border-green-500/20"
          >
            <DollarSign className="w-5 h-5" />
            سحب الأرباح
          </Link>
          <Link
            prefetch={true}
            href="/chat"
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all border border-zinc-700"
          >
            <MessageSquare className="w-5 h-5" />
            المحادثات
          </Link>
          <Link
            prefetch={true}
            href="/lender-dashboard/add-device"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
          >
            <PlusCircle className="w-5 h-5" />
            إضافة جهاز جديد
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-zinc-900/50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Devices List */}
      <div className="glass-panel rounded-2xl overflow-hidden mb-8">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">أجهزتي</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-zinc-400">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 font-medium">اسم الجهاز</th>
                <th className="px-6 py-4 font-medium">النوع</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">إجمالي الأرباح</th>
                <th className="px-6 py-4 font-medium">مدة الجلسة الحالية</th>
                <th className="px-6 py-4 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {devicesWithStats.length > 0 ? devicesWithStats.map((device) => (
                <tr key={device.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                      {device.type === "pc" ? <Monitor className="w-5 h-5 text-zinc-400" /> : <Zap className="w-5 h-5 text-zinc-400" />}
                    </div>
                    {device.name}
                  </td>
                  <td className="px-6 py-4">{device.type === "pc" ? "جهاز كامل" : "بطاقة رسوميات"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      device.status === 'available' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      device.status === 'in-use' ? 'bg-primary/10 text-primary-glow border border-primary/20' : 
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {device.status === 'available' ? 'متاح' : device.status === 'in-use' ? 'مشغول' : 'غير متصل'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">SAR {device.earnings.toLocaleString()}</td>
                  <td className="px-6 py-4">{device.sessionTime}</td>
                  <td className="px-6 py-4">
                    <Link prefetch={true} href={`/lender-dashboard/device/${device.id}`} className="text-primary hover:text-primary-glow font-medium">
                      إدارة
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">لا توجد أجهزة مضافة حالياً. قم بإضافة جهاز جديد لعرضه هنا.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
