"use client";

import { useState } from "react";
import Link from "next/link";
import { Cpu, Mail, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) return;
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Ensure user is in public.users
        const user = data.user;
        if (user) {
          const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();

          if (!userData) {
            // Row doesn't exist — create it via upsert
            console.log("[Login] Creating user row via upsert...");
            await supabase
              .from('users')
              .upsert({ id: user.id, email: user.email || '' }, { onConflict: 'id' });
            window.location.href = "/login/role";
          } else if (!userData.role) {
            window.location.href = "/login/role";
          } else if (userData.role === "lender") {
            window.location.href = "/lender-dashboard";
          } else {
            window.location.href = "/dashboard";
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location?.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage("تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.");
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center neon-border">
              <Cpu className="w-7 h-7 text-primary-glow" />
            </div>
          </Link>
        </div>

        <div className="glass-panel p-8 rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </h1>
            <p className="text-zinc-400 text-sm">مرحباً بك في منصة نور</p>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">الاسم الكامل</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="الاسم الكامل"
                    dir="rtl"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-50"
            >
              {loading ? "جاري المعالجة..." : (isLogin ? "تسجيل الدخول" : "إنشاء الحساب")}
            </button>

            {message && <p className="text-sm text-center text-zinc-400 mt-2">{message}</p>}
          </div>

          <div className="mt-8 text-center text-sm text-zinc-400">
            {isLogin ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
            <button
              onClick={() => { setIsLogin(!isLogin); setMessage(""); }}
              className="text-primary hover:text-primary-glow font-medium transition-colors"
            >
              {isLogin ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
