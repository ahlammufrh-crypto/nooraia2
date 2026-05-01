"use client";
import { ShieldCheck } from "lucide-react";

export default function Verification() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">التوثيق</h1>
      <div className="glass-panel p-8 rounded-2xl text-center">
        <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">حالة التوثيق</h2>
        <p className="text-zinc-400 mb-6">لم يتم توثيق حسابك بعد. يرجى إكمال عملية التوثيق لتتمكن من استئجار وعرض الأجهزة.</p>
        <button className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all border border-zinc-700">
          بدء عملية التوثيق (قريباً)
        </button>
      </div>
    </div>
  );
}
