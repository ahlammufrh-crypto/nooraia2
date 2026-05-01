"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, CreditCard, Clock, Activity, Zap } from "lucide-react";
import Link from "next/link";

export default function PaymentPage({ params }: { params: Promise<{ booking_id: string }> }) {
  const { booking_id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    async function fetchBooking() {
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
            name,
            type,
            hourly_price
          )
        `)
        .eq("id", booking_id)
        .single();

      if (error || !data) {
        alert("لم يتم العثور على الحجز");
        router.push("/dashboard");
        return;
      }

      setBooking(data);
      setLoading(false);
    }
    fetchBooking();
  }, [booking_id, router, supabase]);

  const handlePay = async () => {
    setPaying(true);
    try {
      // Call the secure activation endpoint to handle orchestration and payment logging
      const res = await fetch("/api/bookings/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ أثناء تفعيل الحجز");
      }

      // ONLY after successful activation, redirect to dashboard
      alert("تم الدفع بنجاح! تم تفعيل الحجز وتجهيز الجهاز.");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(error.message || "حدث خطأ أثناء إتمام الدفع");
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="max-w-xl mx-auto px-4 py-24 text-center text-zinc-400 font-medium">جاري تجهيز صفحة الدفع...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
          <CreditCard className="w-8 h-8 text-primary-glow" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">إتمام الدفع</h1>
        <p className="text-zinc-400">نظام دفع تجريبي (Fake Payment System)</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800/50 pb-4">تفاصيل الحجز</h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 flex items-center gap-2"><Zap className="w-4 h-4" /> الجهاز</span>
            <span className="text-white font-bold">{booking.devices?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 flex items-center gap-2"><Activity className="w-4 h-4" /> النوع</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary-glow border border-primary/20">
              {booking.devices?.type === 'pc' ? 'جهاز كامل' : 'بطاقة رسوميات'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 flex items-center gap-2"><Clock className="w-4 h-4" /> وقت البدء</span>
            <span className="text-white" dir="ltr">{new Date(booking.start_time).toLocaleString('ar-SA')}</span>
          </div>
          <div className="flex justify-between items-center border-b border-zinc-800/50 pb-4">
            <span className="text-zinc-400 flex items-center gap-2"><Clock className="w-4 h-4" /> وقت الانتهاء</span>
            <span className="text-white" dir="ltr">{new Date(booking.end_time).toLocaleString('ar-SA')}</span>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold text-white">المبلغ الإجمالي</span>
            <span className="text-3xl font-bold text-primary-glow">{booking.total_price} ﷼</span>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3 mb-8 text-green-400 text-sm">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <p>هذا نظام دفع تجريبي. النقر على "ادفع الآن" سيقوم بتأكيد الحجز وتفعيله مباشرة دون خصم أي مبالغ حقيقية.</p>
        </div>

        <div className="flex gap-4">
          <Link 
            href="/dashboard"
            className="flex-1 py-4 text-center bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-lg font-bold transition-all border border-zinc-700"
          >
            إلغاء
          </Link>
          <button
            onClick={handlePay}
            disabled={paying}
            className="flex-[2] py-4 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl text-lg font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-50"
          >
            {paying ? "جاري تأكيد الدفع..." : "ادفع الآن"}
          </button>
        </div>
      </div>
    </div>
  );
}
