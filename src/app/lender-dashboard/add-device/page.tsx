"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Cpu, Zap, HardDrive, Monitor, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AddDevice() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [deviceType, setDeviceType] = useState<"pc" | "gpu">("pc");
  
  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (!userData?.role) {
        window.location.href = "/login/role";
      } else if (userData.role !== 'lender') {
        window.location.href = "/dashboard";
      }
    }
    checkRole();
  }, [supabase]);
  
  const [formData, setFormData] = useState({
    name: "",
    cpu: "",
    gpu: "",
    ram: "",
    storage: "",
    price: "",
    rental_duration: "",
  });

  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  // Saudi market price suggestions
  const suggestedPrices = {
    gpu: { min: 2, max: 8 },
    pc: { min: 4, max: 15 },
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
    
    // Validate required fields
    if (!formData.name || !formData.cpu || !formData.gpu || !formData.ram || !formData.storage || !formData.price) {
      alert("الرجاء تعبئة جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("يجب تسجيل الدخول أولاً");
        router.push("/login");
        return;
      }

      const { error } = await supabase.from("devices").insert({
        lender_id: user.id,
        type: deviceType,
        name: formData.name,
        cpu: formData.cpu,
        gpu: formData.gpu,
        ram: formData.ram,
        storage: formData.storage,
        hourly_price: parseFloat(formData.price),
        rental_duration: formData.rental_duration || "غير محدد",
        status: "available",
      });

      if (error) {
        console.error("Supabase insert error details:", error);
        throw new Error(error.message || "حدث خطأ أثناء الإضافة في قاعدة البيانات");
      }

      alert("تمت إضافة الجهاز بنجاح");
      router.push("/lender-dashboard");
    } catch (error: any) {
      console.error("Error adding device:", error);
      alert(error.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/lender-dashboard" className="p-2 glass-panel rounded-lg hover:bg-zinc-800 transition-colors">
          <ArrowRight className="w-5 h-5 text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">إضافة جهاز جديد</h1>
          <p className="text-zinc-400">قم بإضافة مواصفات جهازك لعرضه للإيجار</p>
        </div>
      </div>

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
            <label className="block text-sm font-medium text-zinc-400 mb-2">اسم الجهاز (مثال: Alpha Gaming PC)</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="أدخل اسم مميز لجهازك"
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
                  placeholder="مثال: Intel i9-14900K"
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
                  placeholder="مثال: RTX 4090"
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
                  placeholder="مثال: 64GB DDR5"
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
                  placeholder="مثال: 2TB NVMe SSD"
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
                placeholder={`السعر المقترح: ${suggestedPrices[deviceType].min} - ${suggestedPrices[deviceType].max} ريال`}
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
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl text-base font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "جاري الإضافة..." : "حفظ وإضافة الجهاز"}
        </button>
      </form>
    </div>
  );
}
