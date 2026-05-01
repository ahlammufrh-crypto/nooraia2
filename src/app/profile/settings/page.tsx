"use client";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('users').select('notifications_enabled, dark_mode').eq('id', session.user.id).single();
        if (profile) {
          if (profile.notifications_enabled !== null) setNotifications(profile.notifications_enabled);
          if (profile.dark_mode !== null) setDarkMode(profile.dark_mode);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      notifications_enabled: notifications,
      dark_mode: darkMode
    });

    setSaving(false);
    if (error) {
      console.error("Supabase Error [Settings Upsert]:", JSON.stringify(error, null, 2));
      console.error("Details:", error.message, error.details, error.hint);
      alert(`حدث خطأ أثناء حفظ الإعدادات: ${error.message || "تحقق من اتصالك بالإنترنت"}`);
    } else {
      alert("تم حفظ الإعدادات بنجاح");
    }
  };

  if (loading) return <div className="p-8 text-center text-white">جاري التحميل...</div>;
  if (!user) return <div className="p-8 text-center text-white">يجب تسجيل الدخول</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">الإعدادات</h1>
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">الإشعارات</h3>
            <p className="text-sm text-zinc-400">تلقي إشعارات الحجوزات والرسائل</p>
          </div>
          <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="w-5 h-5 accent-primary" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">الوضع المظلم</h3>
            <p className="text-sm text-zinc-400">تفعيل المظهر الداكن للتطبيق</p>
          </div>
          <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} disabled className="w-5 h-5 accent-primary opacity-50 cursor-not-allowed" title="الوضع المظلم هو الوضع الافتراضي حالياً" />
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary text-zinc-950 font-bold rounded-xl hover:bg-primary-glow transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50">
          <Save className="w-5 h-5" />
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </form>
    </div>
  );
}
