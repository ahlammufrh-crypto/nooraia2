"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Cpu, Zap, HardDrive, Monitor, DollarSign, AlertCircle, Trash2, Activity } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EditDevice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deviceType, setDeviceType] = useState<"pc" | "gpu">("pc");
  
  const [formData, setFormData] = useState({
    name: "",
    cpu: "",
    gpu: "",
    ram: "",
    storage: "",
    price: "",
    rental_duration: "",
  });

  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [deviceStatus, setDeviceStatus] = useState<string>("available");
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  // Saudi market price suggestions
  const suggestedPrices = {
    gpu: { min: 2, max: 8 },
    pc: { min: 4, max: 15 },
  };

  useEffect(() => {
    async function fetchDevice() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("id", id)
        .eq("lender_id", session.user.id)
        .single();

      if (error || !data) {
        alert("لم يتم العثور على الجهاز أو ليس لديك صلاحية للوصول إليه");
        router.push("/lender-dashboard");
        return;
      }

      setDeviceType(data.type as "pc" | "gpu");
      setDeviceStatus(data.status);
      setFormData({
        name: data.name,
        cpu: data.cpu,
        gpu: data.gpu,
        ram: data.ram,
        storage: data.storage,
        price: data.hourly_price.toString(),
        rental_duration: data.rental_duration || "",
      });

      // Fetch active booking if in-use
      if (data.status === 'in-use') {
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('device_id', data.id)
          .eq('status', 'active')
          .single();
        setActiveBooking(booking);
      }

      setLoading(false);
    }
    fetchDevice();
  }, [id, router, supabase]);

  const handleExtendSession = async () => {
    if (!activeBooking) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: activeBooking.id, action: 'extend_session' })
      });
      if (res.ok) {
        const { newEndTime } = await res.json();
        setActiveBooking({ ...activeBooking, end_time: newEndTime });
        alert("تم تمديد الجلسة بنجاح");
      }
    } catch (error) {
      console.error("Extension error:", error);
    }
  };

  const handleTerminateSession = async () => {
    if (!activeBooking || !confirm("هل أنت متأكد من إنهاء الجلسة؟ سيتم فصل المستأجر فوراً.")) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: activeBooking.id, action: 'end_session' })
      });
      if (res.ok) {
        setActiveBooking(null);
        setDeviceStatus("available");
        alert("تم إنهاء الجلسة وتحرير الجهاز");
      }
    } catch (error) {
      console.error("Termination error:", error);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, price: val });
    
    if (!val) {
      setPriceWarning(null);
      return;
    }

    const priceNum = parseFloat(val);
    const range = suggestedPrices[deviceType];

    if (priceNum > range.max) {
      setPriceWarning(`انتباه: السعر أعلى من متوسط السوق (${range.max} ريال/ساعة) وقد يقلل من فرص التأجير.`);
    } else if (priceNum < range.min) {
      setPriceWarning(`ملاحظة: السعر أقل من متوسط السوق (${range.min} ريال/ساعة).`);
    } else {
      setPriceWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.cpu || !formData.gpu || !formData.ram || !formData.storage || !formData.price) {
      alert("الرجاء تعبئة جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("devices")
        .update({
          type: deviceType,
          name: formData.name,
          cpu: formData.cpu,
          gpu: formData.gpu,
          ram: formData.ram,
          storage: formData.storage,
          hourly_price: parseFloat(formData.price),
          rental_duration: formData.rental_duration || "غير محدد",
        })
        .eq("id", id);

      if (error) {
        console.error("Supabase update error details:", error);
        throw new Error(error.message || "حدث خطأ أثناء التحديث في قاعدة البيانات");
      }

      alert("تم تحديث الجهاز بنجاح");
      router.push("/lender-dashboard");
    } catch (error: any) {
      console.error("Error updating device:", error);
      alert(error.message || "حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الجهاز بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw new Error(error.message);
      alert("تم حذف الجهاز بنجاح");
      router.push("/lender-dashboard");
    } catch (error: any) {
      console.error("Error deleting device:", error);
      alert(error.message || "حدث خطأ أثناء الحذف");
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-24 text-center text-zinc-400 font-medium">جاري تحميل بيانات الجهاز...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/lender-dashboard" className="p-2 glass-panel rounded-lg hover:bg-zinc-800 transition-colors">
            <ArrowRight className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">إدارة الجهاز</h1>
            <p className="text-zinc-400">تعديل مواصفات الجهاز أو إزالته</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? "جاري الحذف..." : "حذف الجهاز"}
        </button>
      </div>

      {/* Active Session Management */}
      {deviceStatus === 'in-use' && activeBooking && (
        <div className="glass-panel p-6 rounded-2xl mb-6 border-primary/30 bg-primary/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-glow" /> إدارة الجلسة النشطة
            </h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
              نشط الآن
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">وقت البدء</p>
              <p className="text-sm font-bold text-white">{new Date(activeBooking.start_time).toLocaleString('ar-SA')}</p>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">وقت الانتهاء المتوقع</p>
              <p className="text-sm font-bold text-white">{new Date(activeBooking.end_time).toLocaleString('ar-SA')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExtendSession}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all border border-zinc-700"
            >
              تمديد الجلسة (ساعة)
            </button>
            <button 
              onClick={handleTerminateSession}
              className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all border border-red-500/30"
            >
              إنهاء الجلسة فوراً
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Device Type Selection */}
        <div className="glass-panel p-6 rounded-2xl">
          <label className="block text-sm font-bold text-white mb-4">نوع الجهاز</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDeviceType("pc")}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                deviceType === "pc"
                  ? "border-primary bg-primary/10 text-primary-glow"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
              }`}
            >
              <Monitor className={`w-6 h-6 ${deviceType === "pc" ? "text-primary-glow" : "text-zinc-500"}`} />
              <span className="font-bold">جهاز كامل (PC)</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceType("gpu")}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                deviceType === "gpu"
                  ? "border-primary bg-primary/10 text-primary-glow"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
              }`}
            >
              <Zap className={`w-6 h-6 ${deviceType === "gpu" ? "text-primary-glow" : "text-zinc-500"}`} />
              <span className="font-bold">بطاقة رسوميات (GPU)</span>
            </button>
          </div>
        </div>

        {/* Specifications Form */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">اسم الجهاز</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">المعالج (CPU)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Cpu className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  required
                  type="text"
                  value={formData.cpu}
                  onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">بطاقة الرسوميات (GPU)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Zap className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  required
                  type="text"
                  value={formData.gpu}
                  onChange={(e) => setFormData({ ...formData, gpu: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">الذاكرة العشوائية (RAM)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <HardDrive className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  required
                  type="text"
                  value={formData.ram}
                  onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">مساحة التخزين</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <HardDrive className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  required
                  type="text"
                  value={formData.storage}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">مدة التأجير المتاحة / التوفر</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={formData.rental_duration}
                  onChange={(e) => setFormData({ ...formData, rental_duration: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="مثال: من 4 ساعات إلى أسبوعين، متاح يومياً"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="glass-panel p-6 rounded-2xl">
          <label className="block text-sm font-bold text-white mb-4">التسعير</label>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">سعر التأجير في الساعة (ريال سعودي)</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                required
                type="number"
                step="0.01"
                min="0.1"
                value={formData.price}
                onChange={handlePriceChange}
                className={`w-full bg-zinc-900 border ${priceWarning?.includes('انتباه') ? 'border-yellow-500/50 focus:ring-yellow-500' : 'border-zinc-800 focus:ring-primary'} rounded-xl py-3 pl-4 pr-10 text-white placeholder-zinc-600 focus:ring-1 outline-none transition-all`}
                dir="ltr"
              />
            </div>
            {priceWarning && (
              <div className={`mt-3 flex items-start gap-2 text-sm ${priceWarning.includes('انتباه') ? 'text-yellow-500' : 'text-zinc-400'}`}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{priceWarning}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl text-base font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "جاري التحديث..." : "حفظ التعديلات"}
        </button>
      </form>
    </div>
  );
}
