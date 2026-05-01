import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Verify caller is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("[API /users/role] Auth failed:", authError?.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse request body
  const body = await request.json();
  const { role } = body;

  if (!role || !["tenant", "lender"].includes(role)) {
    return NextResponse.json({ error: "Invalid role. Must be 'tenant' or 'lender'" }, { status: 400 });
  }

  console.log("[API /users/role] User:", user.id, "Setting role:", role);

  // 3. Upsert: insert if missing, update if exists
  const { data: upsertData, error: upsertError } = await supabase
    .from("users")
    .upsert(
      { id: user.id, email: user.email || "", role: role },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (upsertError) {
    console.error("[API /users/role] Upsert failed:", upsertError);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  console.log("[API /users/role] Upsert success:", upsertData);

  // 4. Verify by reading back
  const { data: verifyData, error: verifyError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (verifyError || verifyData?.role !== role) {
    console.error("[API /users/role] Verify failed:", { verifyData, verifyError });
    return NextResponse.json({ error: "Role was not saved correctly" }, { status: 500 });
  }

  console.log("[API /users/role] Verified role:", verifyData.role);
  return NextResponse.json({ role: verifyData.role });
}
