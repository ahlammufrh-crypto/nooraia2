"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, Landmark, User, FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WithdrawPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Fetch Wallet Balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    
    if (wallet) setBalance(Number(wallet.balance));

    // Fetch Withdrawal History
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (withdrawals) setHistory(withdrawals);
    
    setLoading(false);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError("يرجى إدخال مبلغ صحيح");
      return;
    }
    if (withdrawAmount > balance) {
      setError("الرصيد غير كافٍ");
      return;
    }
    if (!bankName || !iban || !accountName) {
      setError("يرجى تعبئة كافة البيانات البنكية");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          bank_name: bankName,
          iban,
          account_name: accountName
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء الطلب");

      setSuccess("تم تقديم طلب السحب بنجاح. قيد المراجعة.");
      setAmount("");
      setBankName("");
      setIban("");
      setAccountName("");
      await fetchData(); // Refresh balance and history

    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-zinc-400">جاري تحميل المحفظة...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/lender-dashboard" className="text-primary hover:underline text-sm mb-6 inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        العودة للوحة التحكم
      </Link>
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
          <DollarSign className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">المحفظة والسحب</h1>
          <p className="text-zinc-400 text-sm">قم بإدارة أرباحك وطلب تحويلها إلى حسابك البنكي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Balance Card */}
        <div className="glass-panel p-8 rounded-2xl md:col-span-1 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border-t border-t-primary/20 relative overflow-hidden flex flex-col justify-center items-center text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
          <p className="text-sm text-zinc-400 mb-2">الرصيد القابل للسحب</p>
          <div className="text-4xl font-bold text-white mb-1">{balance.toLocaleString()} <span className="text-lg text-primary-glow">﷼</span></div>
        </div>

        {/* Withdrawal Form */}
        <div className="glass-panel p-6 rounded-2xl md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800/50 pb-4">تقديم طلب سحب جديد</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">المبلغ المطلوب سحبه (﷼)</label>
              <div className="relative">
                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`الحد الأقصى: ${balance}`}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-12 pl-4 text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">اسم البنك</label>
                <div className="relative">
                  <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثل: مصرف الراجحي"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-12 pl-4 text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">اسم صاحب الحساب</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="الاسم الثلاثي مطابق للبنك"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-12 pl-4 text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">رقم الآيبان (IBAN)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  placeholder="SA0000000000000000000000"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-1 focus:ring-primary outline-none transition-all text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || balance <= 0}
              className="w-full py-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl text-lg font-bold transition-all mt-4 disabled:opacity-50"
            >
              {submitting ? "جاري الإرسال..." : "تأكيد طلب السحب"}
            </button>
          </form>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">سجل السحوبات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-zinc-400">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الطلب</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">البنك</th>
                <th className="px-6 py-4 font-medium">المبلغ</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((req) => (
                <tr key={req.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{req.id.split('-')[0]}...</td>
                  <td className="px-6 py-4">{new Date(req.created_at).toLocaleDateString('ar-SA')}</td>
                  <td className="px-6 py-4 text-white">{req.bank_name}</td>
                  <td className="px-6 py-4 font-bold text-white">{Number(req.amount).toLocaleString()} ﷼</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      req.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                      req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {req.status === 'approved' ? 'مقبول' : req.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">لا توجد طلبات سحب سابقة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
