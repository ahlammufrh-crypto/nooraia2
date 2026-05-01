import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');

    if (!paymentId) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const supabase = await createClient();
    
    let dbStatus = "failed";
    if (status === "paid") {
      dbStatus = "succeeded";
    }

    await supabase.from("payments").update({ status: dbStatus }).eq("id", paymentId);

    if (dbStatus === "succeeded") {
      const { data: payment } = await supabase.from("payments").select("booking_id").eq("id", paymentId).single();
      if (payment?.booking_id) {
        // Fetch booking and device info
        const { data: booking } = await supabase
          .from("bookings")
          .select("*, device:devices(*)")
          .eq("id", payment.booking_id)
          .single();

        if (booking) {
          let accessDetails = {};
          if (booking.device.type === "pc") {
            accessDetails = {
              method: "Sunshine/Moonlight",
              host: "100.12.34.56", // Mock host
              pin: "1234",
              instructions: "Use Moonlight client to connect to the host IP with the provided PIN."
            };
          } else if (booking.device.type === "gpu") {
            accessDetails = {
              method: "SSH/Docker",
              command: "ssh user@100.12.34.56 -p 2222",
              password: "mock_password",
              instructions: "Use the provided command to connect via terminal."
            };
          }

          await supabase.from("bookings").update({ 
            status: "active",
            access_details: accessDetails
          }).eq("id", payment.booking_id);

          // Update device status to 'in-use'
          await supabase.from("devices").update({ status: "in-use" }).eq("id", booking.device.id);
        }
      }
    }

    // Role-based redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (!userData?.role) {
        return NextResponse.redirect(new URL("/login/role", req.url));
      }
      if (userData.role === 'lender') {
        return NextResponse.redirect(new URL("/lender-dashboard", req.url));
      }
    }

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Callback error:", error);
    // Even on error, try to redirect based on role if possible, or fallback to root
    return NextResponse.redirect(new URL("/", req.url));
  }
}
