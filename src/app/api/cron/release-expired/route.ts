import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    // 1. Find all active or pending bookings that have expired, including device lender and payment info
    const { data: expiredBookings, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, device_id, devices(lender_id), payments(lender_payout)")
      .in("status", ["active", "pending"])
      .lt("end_time", now);

    if (fetchErr) {
      console.error("[Cron] Failed to fetch expired bookings:", fetchErr);
      return NextResponse.json({ error: "Failed to fetch expired bookings" }, { status: 500 });
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      return NextResponse.json({ success: true, message: "No expired bookings found", releasedCount: 0 });
    }

    const bookingIds = expiredBookings.map((b) => b.id);
    const deviceIds = [...new Set(expiredBookings.map((b) => b.device_id))];

    // 2. Mark bookings as completed
    const { error: updateBookingsErr } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .in("id", bookingIds);

    if (updateBookingsErr) {
      console.error("[Cron] Failed to complete bookings:", updateBookingsErr);
      throw updateBookingsErr;
    }

    // 3. Release the devices
    const { error: updateDevicesErr } = await supabase
      .from("devices")
      .update({ status: "available" })
      .in("id", deviceIds);

    if (updateDevicesErr) {
      console.error("[Cron] Failed to release devices:", updateDevicesErr);
      throw updateDevicesErr;
    }

    // 4. Credit Lender Wallets
    for (const booking of expiredBookings) {
      const devices: any = booking.devices;
      const lender_id = Array.isArray(devices) ? devices[0]?.lender_id : devices?.lender_id;
      // Depending on how Supabase joins 1-to-1 or 1-to-many, payments might be an array
      const payments: any = booking.payments;
      const paymentRecord = Array.isArray(payments) ? payments[0] : payments;
      const payout = paymentRecord?.lender_payout;

      if (lender_id && payout) {
        const { error: rpcErr } = await supabase.rpc('increment_wallet_balance', {
          p_user_id: lender_id,
          p_amount: payout
        });
        
        if (rpcErr) {
          console.error(`[Cron] Failed to credit wallet for lender ${lender_id}:`, rpcErr);
        }
      }
    }

    console.log(`[Cron] Successfully released ${deviceIds.length} devices from ${bookingIds.length} expired bookings.`);
    
    return NextResponse.json({ 
      success: true, 
      releasedBookings: bookingIds.length,
      releasedDevices: deviceIds.length
    });

  } catch (error: any) {
    console.error("[Cron Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
