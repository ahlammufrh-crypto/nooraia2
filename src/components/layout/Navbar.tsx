"use client";

import Link from "next/link";
import { Monitor, Cpu, LogIn, Video, User, Server } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
        setUserName(name);
        
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (userData?.role) {
          setUserRole(userData.role);
        }
      }
    };
    getUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
        setUserName(name);
        
        supabase.from('users').select('role').eq('id', session.user.id).single().then(({ data }) => {
          if (data?.role) setUserRole(data.role);
        });
      } else {
        setUser(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  const navLinks = [
    { name: "الرئيسية", href: "/", icon: <Monitor className="w-4 h-4 ml-2" /> },
    { name: "السوق", href: "/marketplace", icon: <Cpu className="w-4 h-4 ml-2" /> },
  ];

  if (userRole === "lender") {
    navLinks.push({ name: "لوحة تحكم المؤجر", href: "/lender-dashboard", icon: <Server className="w-4 h-4 ml-2" /> });
  } else if (user) {
    navLinks.push({ name: "لوحة تحكم المستأجر", href: "/dashboard", icon: <Monitor className="w-4 h-4 ml-2" /> });
  }

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded bg-[#000000] border border-[#1A2B4C] flex items-center justify-center shadow-[0_0_10px_rgba(0,255,255,0.2)] overflow-hidden relative group-hover:border-[#00FFFF]/50 transition-all">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 h-full bg-[#1A2B4C] transform -skew-x-12 translate-x-1"></div>
                  <div className="w-[2px] h-full bg-[#00FFFF] transform -skew-x-12 shadow-[0_0_8px_#00FFFF]"></div>
                </div>
                <span className="relative z-10 font-black text-2xl tracking-tighter text-white">N</span>
              </div>
              <span className="font-black text-2xl tracking-widest text-white group-hover:text-[#00FFFF] transition-colors" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Noorai
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary-glow"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-bold shadow-md hover:bg-zinc-700 transition-colors focus:outline-none"
                >
                  <User className="w-4 h-4" />
                  {userName}
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-sm font-medium text-white">{userName}</p>
                      <p className="text-xs text-zinc-400 truncate mt-1" dir="ltr">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link onClick={() => setIsDropdownOpen(false)} href="/profile/account" className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">معلومات الحساب</Link>
                      <Link onClick={() => setIsDropdownOpen(false)} href="/profile/security" className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">كلمة المرور والأمان</Link>
                      <Link onClick={() => setIsDropdownOpen(false)} href="/profile/verification" className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">التوثيق</Link>
                      <Link onClick={() => setIsDropdownOpen(false)} href="/profile/bank" className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">الحساب البنكي</Link>
                      <Link onClick={() => setIsDropdownOpen(false)} href="/profile/settings" className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">الإعدادات</Link>
                    </div>
                    <div className="py-1 border-t border-zinc-800">
                      <button 
                        onClick={async () => {
                          await supabase.auth.signOut();
                          setIsDropdownOpen(false);
                          window.location.href = '/';
                        }}
                        className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center px-4 py-2 bg-[#1A2B4C] hover:bg-[#00FFFF] text-white hover:text-black rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(26,43,76,0.5)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]"
              >
                <LogIn className="w-4 h-4 ml-2" />
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
