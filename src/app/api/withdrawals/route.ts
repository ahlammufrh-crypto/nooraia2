import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, bank_name, iban, account_name } = body;

    if (!amount || amount <= 0 || !bank_name || !iban || !account_name) {
      return NextResponse.json({ error: "Missing required fields or invalid amount" }, { status: 400 });
    }

    // Process the withdrawal via our secure RPC function
    const { data: result, error: rpcError } = await supabase.rpc('process_withdrawal', {
      p_user_id: user.id,
      p_amount: amount,
      p_bank_name: bank_name,
      p_iban: iban,
      p_account_name: account_name
    });

    if (rpcError) {
      console.error("[Withdrawal] RPC Error:", rpcError);
      return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, withdrawal_id: result.withdrawal_id });

  } catch (error: any) {
    console.error("[Withdrawal API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
