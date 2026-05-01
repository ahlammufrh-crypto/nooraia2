"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lock, Save } from "lucide-react";

export default function Security() {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      console.error("Supabase Error [Security Update]:", JSON.stringify(error, null, 2));
      console.error("Details:", error.message, (error as any).details, (error as any).hint);
      alert(`حدث خطأ أثناء تغيير كلمة المرور: ${error.message}`);
    } else {
      alert("تم تغيير كلمة المرور بنجاح");
      setPassword("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">كلمة المرور والأمان</h1>
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">كلمة المرور الجديدة</label>
          <div className="relative">
            <Lock className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-10 pl-4 text-white outline-none focus:border-primary" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary text-zinc-950 font-bold rounded-xl hover:bg-primary-glow transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50">
          <Save className="w-5 h-5" />
          {saving ? "جاري التحديث..." : "تحديث كلمة المرور"}
        </button>
      </form>
    </div>
  );
}
