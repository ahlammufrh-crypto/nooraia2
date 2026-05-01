"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cpu, Zap, Activity, Star, Monitor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Marketplace() {
  const [filterType, setFilterType] = useState<"all" | "pc" | "gpu">("all");
  const [pcs, setPcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Trigger auto-release sweep passively to free up expired devices
        fetch("/api/cron/release-expired").catch(e => console.error("Auto-release trigger failed:", e));

        const supabase = createClient();
        // Fetch devices that are 'available' or have no status set yet
        const { data, error } = await supabase
          .from("devices")
          .select("*")
          .or('status.eq.available,status.is.null');
          
        if (error) {
          console.error("Error fetching marketplace devices:", error);
        } else if (data) {
          // Normalize null statuses to 'available' for the UI
          const normalizedData = data.map(d => ({
            ...d,
            status: d.status || 'available'
          }));
          setPcs(normalizedData);
        }
      } catch (err) {
        console.error("Unexpected error fetching devices:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const filteredPcs = pcs.filter((pc) => {
    if (filterType === "all") return true;
    if (filterType === "pc") return pc.type === "pc";
    if (filterType === "gpu") return pc.type === "gpu";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="glass-panel p-6 rounded-2xl sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="text-primary-glow" /> الفلاتر
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">نوع الجهاز</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFilterType("pc")}
                    className={`p-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      filterType === "pc"
                        ? "border-primary bg-primary/10 text-primary-glow"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Monitor className="w-4 h-4" /> PC
                  </button>
                  <button
                    onClick={() => setFilterType("gpu")}
                    className={`p-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      filterType === "gpu"
                        ? "border-primary bg-primary/10 text-primary-glow"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Zap className="w-4 h-4" /> GPU
                  </button>
                </div>
                <button
                  onClick={() => setFilterType("all")}
                  className={`w-full mt-2 p-2 rounded-lg border text-sm font-medium transition-all ${
                    filterType === "all"
                      ? "border-primary bg-primary/10 text-primary-glow"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  الكل
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">بطاقة الرسوميات</label>
                <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all">
                  <option>الكل</option>
                  <option>RTX 4090</option>
                  <option>RTX 4080</option>
                  <option>RX 7900 XTX</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">السعر في الساعة</label>
                <input type="range" className="w-full accent-primary" />
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-8">الأجهزة المتاحة</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 text-center text-zinc-500 py-12">جاري تحميل الأجهزة...</div>
            ) : filteredPcs.length > 0 ? (
              filteredPcs.map((pc) => (
              <div key={pc.id} className="glass-panel rounded-2xl overflow-hidden hover:neon-border transition-all duration-300 group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-primary-glow transition-colors">{pc.name}</h3>
                      <div className="flex items-center mt-1 text-sm">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                        <span className="text-white ml-1">5.0</span>
                        <span className="text-zinc-500 mr-1">(0)</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pc.status === 'available' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {pc.status === 'available' ? 'متاح' : pc.status}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary-glow border border-primary/20">
                        {pc.type === "pc" ? "جهاز كامل" : "بطاقة رسوميات"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-zinc-400">
                      <Zap className="w-4 h-4 ml-2 text-zinc-500" />
                      <span>{pc.gpu}</span>
                    </div>
                    <div className="flex items-center text-sm text-zinc-400">
                      <Cpu className="w-4 h-4 ml-2 text-zinc-500" />
                      <span>{pc.cpu} • {pc.ram}</span>
                    </div>
                    {pc.rental_duration && (
                      <div className="flex items-center text-sm text-zinc-400">
                        <Activity className="w-4 h-4 ml-2 text-zinc-500" />
                        <span>توفر الإيجار: {pc.rental_duration}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-2xl font-bold text-white">{pc.hourly_price} ﷼</span>
                      <span className="text-xs text-zinc-500 mr-1">/ ساعة</span>
                    </div>
                    <Link
                      href={`/pc/${pc.id}`}
                      className="px-6 py-2 bg-zinc-800 hover:bg-primary hover:text-zinc-950 text-white rounded-lg text-sm font-bold transition-all"
                    >
                      التفاصيل
                    </Link>
                  </div>
                </div>
              </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-zinc-500 py-12">لا توجد أجهزة متاحة في هذا التصنيف حالياً.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
