"use client";

import { useState } from "react";
import { UserCircle, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<"tenant" | "lender" | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectRole = async (role: "tenant" | "lender") => {
    setSelectedRole(role);
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();

      // Step 1: Get authenticated user
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      console.log("[RolePage] User:", user?.id, "AuthErr:", authErr?.message);

      if (authErr || !user) {
        setErrorMsg("يجب تسجيل الدخول أولاً.");
        window.location.href = "/login";
        return;
      }

      // Step 2: Save role via server API (handles upsert + RLS)
      console.log("[RolePage] Saving role via API:", selectedRole);
      const res = await fetch("/api/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const resData = await res.json();
      console.log("[RolePage] API response:", res.status, resData);

      if (!res.ok) {
        throw new Error(resData.error || "فشل حفظ الدور");
      }

      // Step 3: Verify the role was saved by reading from DB
      const { data: verifyData, error: verifyErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      console.log("[RolePage] Verify:", verifyData, "Err:", verifyErr?.message);

      if (verifyErr || !verifyData?.role) {
        throw new Error("لم يتم حفظ الدور. حاول مجدداً.");
      }

      // Step 4: Hard navigate to the correct dashboard
      console.log("[RolePage] Navigating to:", verifyData.role);
      if (verifyData.role === "lender") {
        window.location.href = "/lender-dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("[RolePage] Error:", err);
      setErrorMsg(err.message || "حدث خطأ. حاول مجدداً.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="w-full max-w-lg glass-panel p-8 rounded-2xl text-center">
        <h1 className="text-3xl font-bold text-white mb-4">أهلاً بك في منصة نور</h1>
        <p className="text-zinc-400 mb-8">يرجى تحديد نوع حسابك للمتابعة</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => selectRole("tenant")}
            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-4 ${
              selectedRole === "tenant"
                ? "border-primary bg-primary/10 text-primary-glow shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
            }`}
          >
            <UserCircle className={`w-12 h-12 ${selectedRole === "tenant" ? "text-primary-glow" : "text-zinc-500"}`} />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">مستأجر</h3>
              <p className="text-xs">أريد استئجار أجهزة للعب أو العمل</p>
            </div>
          </button>

          <button
            onClick={() => selectRole("lender")}
            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-4 ${
              selectedRole === "lender"
                ? "border-primary bg-primary/10 text-primary-glow shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
            }`}
          >
            <Briefcase className={`w-12 h-12 ${selectedRole === "lender" ? "text-primary-glow" : "text-zinc-500"}`} />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">مؤجر</h3>
              <p className="text-xs">أريد عرض أجهزتي للإيجار والربح</p>
            </div>
          </button>
        </div>

        {errorMsg && (
          <p className="text-red-400 text-sm mb-4">{errorMsg}</p>
        )}

        <button
          onClick={handleSaveRole}
          disabled={!selectedRole || loading}
          className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
            selectedRole && !loading
              ? "bg-primary hover:bg-primary-glow text-zinc-950 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {loading ? "جاري الحفظ..." : "متابعة"}
        </button>
      </div>
    </div>
  );
}
