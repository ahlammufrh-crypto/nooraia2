"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RentButton({ price, deviceId }: { price: string, deviceId: string }) {
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState(1);
  const router = useRouter();

  const hourlyRate = parseFloat(price);
  const totalPrice = (hourlyRate * hours).toFixed(2);

  const handleRent = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("يجب تسجيل الدخول أولاً");
        router.push("/login");
        return;
      }

      // Prepare booking data as requested
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

      const bookingPayload = {
        device_id: deviceId,
        user_id: user.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_price: parseFloat(totalPrice),
      };

      console.log("[RentButton] Sending booking request:", bookingPayload);

      // 1. Create booking via server API
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      const bookingData = await bookingRes.json();
      console.log("[RentButton] Booking response:", bookingRes.status, bookingData);

      if (!bookingRes.ok) {
        throw new Error(bookingData.error || "حدث خطأ أثناء إنشاء الحجز");
      }

      // 2. Redirect to payment page as requested (Fake Payment System)
      console.log("[RentButton] Redirecting to fake payment page for booking:", bookingData.booking_id);
      
      router.push(`/payment/${bookingData.booking_id}`);

    } catch (error: any) {
      console.error("[RentButton] Error:", error);
      alert(error.message || "حدث خطأ أثناء إتمام العملية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Duration Selector */}
      <div className="flex items-center justify-between mb-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
        <span className="text-sm text-zinc-400">مدة الإيجار</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHours(Math.max(1, hours - 1))}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors text-lg font-bold"
          >
            −
          </button>
          <span className="text-white font-bold min-w-[3rem] text-center">{hours} ساعة</span>
          <button
            onClick={() => setHours(Math.min(24, hours + 1))}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors text-lg font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Total Price Display */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-zinc-400">{price} ﷼ × {hours} ساعة</span>
        <span className="text-white font-bold text-lg">{totalPrice} ﷼</span>
      </div>

      {/* Rent Button */}
      <button
        onClick={handleRent}
        disabled={loading}
        className="w-full py-4 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl text-lg font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] mb-3 disabled:opacity-50"
      >
        {loading ? "جاري الحفظ والتحويل..." : "استئجار الآن"}
      </button>
    </div>
  );
}
