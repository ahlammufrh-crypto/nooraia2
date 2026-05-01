"use client";
import { useState, useEffect } from "react";
import { CreditCard, Save, Building2, User, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BankAccount() {
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchAccounts(user.id);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const fetchAccounts = async (userId: string) => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching accounts:", error);
    } else if (data) {
      setAccounts(data);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      alert("يجب تسجيل الدخول لإضافة حساب");
      return;
    }

    setSaving(true);
    
    const { data, error } = await supabase.from('bank_accounts').insert({
      user_id: currentUser.id,
      account_name: accountName,
      bank_name: bankName,
      iban: iban
    }).select();

    if (error) {
      setSaving(false);
      console.error("Supabase Error [Bank Insert]:", JSON.stringify(error, null, 2));
      console.error("Details:", error.message, (error as any).details, (error as any).hint);
      alert(`حدث خطأ أثناء حفظ الحساب: ${error.message || "تأكد من الاتصال بقاعدة البيانات"}`);
    } else {
      alert("تمت إضافة الحساب البنكي بنجاح");
      setAccountName("");
      setBankName("");
      setIban("");
      if (data && data.length > 0) {
        setAccounts(prev => [data[0], ...prev]);
      } else {
        await fetchAccounts(currentUser.id);
      }
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحساب البنكي؟")) return;
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    if (error) {
      console.error("Supabase Error [Bank Delete]:", JSON.stringify(error, null, 2));
      console.error("Details:", error.message, (error as any).details, (error as any).hint);
      alert(`حدث خطأ أثناء الحذف: ${error.message || "الرجاء المحاولة لاحقاً"}`);
    } else {
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };

  if (loading) return <div className="p-8 text-center text-white">جاري التحميل...</div>;
  if (!user) return <div className="p-8 text-center text-white">يجب تسجيل الدخول</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">الحسابات البنكية</h1>
        <p className="text-zinc-400">أضف حساباتك البنكية لاستلام أرباحك بأمان</p>
      </div>

      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-6 border border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-4">إضافة حساب بنكي جديد</h2>
        
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">اسم صاحب الحساب</label>
          <div className="relative">
            <User className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
            <input required type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-10 pl-4 text-white outline-none focus:border-primary" placeholder="الاسم الرباعي كما في البنك" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">اسم البنك</label>
          <div className="relative">
            <Building2 className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
            <input required type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-10 pl-4 text-white outline-none focus:border-primary" placeholder="مثال: البنك الأهلي السعودي" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">رقم الآيبان (IBAN)</label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
            <input required dir="ltr" type="text" placeholder="SA..." value={iban} onChange={e => setIban(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-primary uppercase text-left" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="flex items-center justify-center w-full gap-2 px-6 py-3 bg-primary text-zinc-950 font-bold rounded-xl hover:bg-primary-glow transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50">
          <Save className="w-5 h-5" />
          {saving ? "جاري الإضافة..." : "إضافة حساب جديد"}
        </button>
      </form>

      {/* Saved Bank Accounts Section */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-6">الحسابات البنكية المحفوظة</h2>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            لا توجد حسابات بنكية محفوظة حالياً.
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center hover:border-zinc-700 transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-bold text-white">{acc.bank_name}</span>
                  </div>
                  <div className="text-sm text-zinc-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    {acc.account_name}
                  </div>
                  <div className="text-sm font-mono text-zinc-500 mt-1" dir="ltr">{acc.iban}</div>
                </div>
                <button 
                  onClick={() => handleDelete(acc.id)}
                  className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                  title="حذف الحساب"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
