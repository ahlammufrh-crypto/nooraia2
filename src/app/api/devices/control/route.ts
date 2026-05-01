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
    const { device_id, action } = body;

    if (!device_id || !action || !['start', 'stop', 'reset'].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters or action" }, { status: 400 });
    }

    // Verify ownership or active tenancy
    const { data: device } = await supabase.from("devices").select("*").eq("id", device_id).single();
    if (!device) return NextResponse.json({ error: "Device not found" }, { status: 404 });

    const isLender = device.lender_id === user.id;
    
    // Check if user is an active tenant
    const { data: activeBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("device_id", device_id)
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .single();

    const isTenant = !!activeBooking;

    if (!isLender && !isTenant) {
      return NextResponse.json({ error: "Forbidden. You do not have control over this device." }, { status: 403 });
    }

    // In a real system, this is where we would send a webhook to the physical worker node
    // For now, we simulate the orchestration command execution
    console.log(`[Orchestration]: Sending '${action}' command to device ${device_id}`);

    // We could log this in a 'device_logs' table if it existed.
    // Simulating delay for physical execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update status based on action if needed (optional)
    // Update status based on action
    if (action === 'start' && isTenant) {
        if (activeBooking) {
            await supabase.from("bookings").update({ status: 'active' }).eq("id", activeBooking.id);
        }
    } else if (action === 'stop') {
        // When user stops the session, release the device and complete the booking
        if (activeBooking) {
            await supabase.from("bookings").update({ status: 'completed' }).eq("id", activeBooking.id);
            
            // Credit the lender's wallet securely via RPC
            const { data: payment } = await supabase
              .from("payments")
              .select("lender_payout")
              .eq("booking_id", activeBooking.id)
              .single();
              
            if (payment && payment.lender_payout) {
              await supabase.rpc('increment_wallet_balance', {
                p_user_id: device.lender_id,
                p_amount: payment.lender_payout
              });
            }
        }
        await supabase.from("devices").update({ status: 'available' }).eq("id", device_id);
    }

    return NextResponse.json({ 
        success: true, 
        message: `Command '${action}' executed successfully on device.`,
        action_taken: action
    });

  } catch (error: any) {
    console.error("[Control API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
