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
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
    }

    // Fetch booking and device details
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, devices(id, type, lender_id, status)")
      .eq("id", booking_id)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Ensure the booking belongs to the current user
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const device = booking.devices;
    
    if (!device) {
        return NextResponse.json({ error: "Device not available" }, { status: 404 });
    }

    // 1. Mark booking as paid/active
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ status: "active" })
      .eq("id", booking_id);

    if (updateErr) throw updateErr;

    // 2. Create payment record
    await supabase.from("payments").insert({
      booking_id: booking_id,
      user_id: user.id,
      amount: booking.total_price,
      currency: "SAR",
      status: "succeeded",
      transaction_type: "booking",
      platform_fee: booking.total_price * 0.25,
      lender_payout: booking.total_price * 0.75
    });

    // 3. ORCHESTRATION LOGIC (Device Activation)
    let connectionDetails = null;

    if (device.type === 'gpu') {
      // Trigger Docker Prep Logic
      console.log(`[Orchestration] Generating Docker config for GPU device ${device.id}`);
      const dockerConfig = {
        image: "nvidia/cuda:11.8.0-runtime-ubuntu22.04",
        ports: ["22:22", "8888:8888"],
        volumes: ["/data:/data"],
        status: "running" // Mark container as running
      };
      
      // Update device config and mark device as in-use/active
      await supabase.from("devices").update({ 
          docker_config: dockerConfig,
          status: "in-use" 
      }).eq("id", device.id);
      
    } else if (device.type === 'pc') {
      // Trigger Sunshine / PC Rental Logic
      console.log(`[Orchestration] Generating Sunshine connection data for PC device ${device.id}`);
      connectionDetails = {
        protocol: "sunshine/moonlight",
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        ip: "100.x.y.z", // Simulated Tailscale/ZeroTier IP
        status: "active"
      };
      
      // Update booking with connection details
      await supabase.from("bookings").update({ connection_details: connectionDetails }).eq("id", booking_id);
      
      // Mark device as in-use/active
      await supabase.from("devices").update({ status: "in-use" }).eq("id", device.id);
      
      // Simulate sending a notification message to the lender
      const messageText = `تم الدفع واستئجار جهازك! يرجى التأكد من تشغيل تطبيق Sunshine وإدخال رمز الاقتران (PIN) التالي للمستأجر إذا لزم الأمر: ${connectionDetails.pin}`;
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: device.lender_id,
        message: messageText
      });
    }

    return NextResponse.json({ success: true, message: "Activation completed" });

  } catch (error: any) {
    console.error("[Activation Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
