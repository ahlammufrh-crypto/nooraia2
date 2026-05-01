"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Play, Square, Monitor, Zap, Activity, ExternalLink, Terminal, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DeviceControlDashboard({ params }: { params: Promise<{ booking_id: string }> }) {
  const { booking_id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [booking_id]);

  const fetchBooking = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        devices (
          id,
          name,
          type,
          status,
          docker_config
        )
      `)
      .eq("id", booking_id)
      .single();

    if (error || !data) {
      alert("الجلسة غير موجودة");
      router.push("/dashboard");
      return;
    }

    setBooking(data);
    setLoading(false);
  };

  const handleDeviceAction = async (action: 'start' | 'stop') => {
    setActionLoading(true);
    try {
      // Use our control API to handle state
      const res = await fetch("/api/devices/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: booking.device_id, action }),
      });

      if (!res.ok) {
        throw new Error("فشل في تنفيذ الأمر");
      }

      // Update local state and DB state simulation
      const newStatus = action === 'start' ? 'in-use' : 'available';
      await supabase.from("devices").update({ status: newStatus }).eq("id", booking.device_id);
      
      // Update booking connection details state if PC
      if (booking.devices.type === 'pc' && booking.connection_details) {
        await supabase.from("bookings").update({
          connection_details: { ...booking.connection_details, status: action === 'start' ? 'running' : 'stopped' }
        }).eq("id", booking.id);
      } else if (booking.devices.type === 'gpu' && booking.devices.docker_config) {
        await supabase.from("devices").update({
          docker_config: { ...booking.devices.docker_config, status: action === 'start' ? 'running' : 'stopped' }
        }).eq("id", booking.device_id);
      }

      await fetchBooking(); // refresh
    } catch (error: any) {
      alert(error.message || "حدث خطأ");
    } finally {
      setActionLoading(false);
    }
  };

  const getDeviceStatus = () => {
    if (booking?.devices?.type === 'pc') {
      return booking?.connection_details?.status === 'stopped' ? 'stopped' : 'running';
    }
    return booking?.devices?.docker_config?.status === 'stopped' ? 'stopped' : 'running';
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-zinc-400">جاري تحميل لوحة التحكم...</div>;
  }

  const isRunning = getDeviceStatus() === 'running';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link href="/dashboard" className="text-primary hover:underline text-sm mb-2 inline-block">&larr; العودة للوحة التحكم</Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {booking.devices.name}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border ${
              isRunning ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'}`}></span>
              {isRunning ? 'قيد التشغيل' : 'متوقف'}
            </span>
          </h1>
          <p className="text-zinc-400 mt-1">لوحة التحكم والاتصال المباشر</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {!isRunning ? (
            <button 
              onClick={() => handleDeviceAction('start')}
              disabled={actionLoading}
              className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50"
            >
              <Play className="w-4 h-4 ml-2" />
              تشغيل الجهاز
            </button>
          ) : (
            <button 
              onClick={() => handleDeviceAction('stop')}
              disabled={actionLoading}
              className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              <Square className="w-4 h-4 ml-2" />
              إيقاف الجهاز
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-center items-center text-center">
            {isRunning ? (
              booking.devices.type === 'pc' ? (
                <>
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
                    <Monitor className="w-10 h-10 text-primary-glow" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">جلسة البث جاهزة</h2>
                  <p className="text-zinc-400 max-w-md mb-8">الجهاز قيد التشغيل وينتظر اتصالك عبر تطبيق Moonlight.</p>
                  
                  <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-xl w-full max-w-md text-right">
                    <div className="mb-4">
                      <span className="text-xs text-zinc-500 block mb-1">البروتوكول</span>
                      <span className="font-mono text-primary-glow">Sunshine / Moonlight</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs text-zinc-500 block mb-1">عنوان IP (VPN)</span>
                      <span className="font-mono text-white">{booking.connection_details?.ip || '100.x.y.z'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 block mb-1">رمز الاقتران (PIN)</span>
                      <span className="font-mono text-2xl font-bold tracking-widest text-white">{booking.connection_details?.pin || '----'}</span>
                    </div>
                  </div>
                  
                  <button className="mt-8 flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all border border-zinc-700">
                    <ExternalLink className="w-4 h-4" />
                    فتح تطبيق Moonlight
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <Terminal className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">حاوية Docker جاهزة</h2>
                  <p className="text-zinc-400 max-w-md mb-8">البيئة الافتراضية للذكاء الاصطناعي قيد التشغيل وجاهزة للاتصال.</p>
                  
                  <div className="bg-black border border-zinc-800 p-6 rounded-xl w-full max-w-md text-left" dir="ltr">
                    <div className="mb-4">
                      <span className="text-xs text-zinc-500 block mb-1">SSH Connection</span>
                      <code className="text-green-400 block bg-zinc-900 p-2 rounded mt-1">
                        ssh -p 22 ubuntu@{booking.devices.docker_config?.ip || 'gpu.rental.local'}
                      </code>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 block mb-1">Jupyter Notebook (Port 8888)</span>
                      <code className="text-primary-glow block bg-zinc-900 p-2 rounded mt-1">
                        http://localhost:8888
                      </code>
                    </div>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 border border-zinc-700">
                  <Square className="w-10 h-10 text-zinc-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">الجهاز متوقف</h2>
                <p className="text-zinc-500 max-w-md">قم بتشغيل الجهاز للبدء في استخدام الجلسة واستخراج بيانات الاتصال.</p>
              </>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="text-primary-glow w-5 h-5" />
              تفاصيل الجلسة
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                <span className="text-zinc-400">حالة الجلسة</span>
                <span className={isRunning ? "text-green-400" : "text-zinc-500"}>{isRunning ? "نشطة" : "متوقفة"}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                <span className="text-zinc-400">نوع الاستئجار</span>
                <span className="text-white">{booking.devices.type === 'pc' ? 'جهاز كامل' : 'بطاقة رسوميات'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                <span className="text-zinc-400">وقت البدء المجدول</span>
                <span className="text-white">{new Date(booking.start_time).toLocaleTimeString('ar-SA')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">وقت الانتهاء</span>
                <span className="text-white">{new Date(booking.end_time).toLocaleTimeString('ar-SA')}</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
              <ShieldAlert className="text-primary-glow w-4 h-4" />
              نظام المحاكاة
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              هذه الواجهة هي جزء من طبقة محاكاة بيئة التشغيل (Simulation Layer) المطلوبة. كافة بيانات الاتصال والروابط الظاهرة هنا هي بيانات تجريبية (Mock Data) تثبت نجاح تسلسل النظام من الدفع وحتى تشغيل الحاوية أو البث.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
