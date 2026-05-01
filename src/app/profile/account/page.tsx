"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Save } from "lucide-react";

export default function AccountInfo() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Try fetching from public.users first
        const { data: profile } = await supabase.from('users').select('full_name').eq('id', session.user.id).single();
        if (profile?.full_name) {
          setName(profile.full_name);
        } else {
          setName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "");
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: name }
    });

    // Upsert into public.users
    const { error: dbError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: name
    });

    setSaving(false);

    if (authError || dbError) {
      const err = authError || dbError;
      console.error("Supabase Error [Account Upsert]:", JSON.stringify(err, null, 2));
      console.error("Details:", err?.message, (err as any)?.details, (err as any)?.hint);
      alert(`حدث خطأ أثناء الحفظ: ${err?.message || "الرجاء التحقق من صحة البيانات"}`);
    } else {
      alert("تم تحديث البيانات بنجاح");
    }
  };

  if (loading) return <div className="p-8 text-center text-white">جاري التحميل...</div>;
  if (!user) return <div className="p-8 text-center text-white">يجب تسجيل الدخول</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">معلومات الحساب</h1>
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">الاسم</label>
          <div className="relative">
            <User className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-10 pl-4 text-white outline-none focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
            <input type="email" value={user.email} disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-10 pl-4 text-zinc-500 outline-none cursor-not-allowed" dir="ltr" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary text-zinc-950 font-bold rounded-xl hover:bg-primary-glow transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50">
          <Save className="w-5 h-5" />
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
    </div>
  );
}
