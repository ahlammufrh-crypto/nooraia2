import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { action, device_id, user_id, start_time, end_time, total_price } = body;

    // ─── CREATE NEW BOOKING ───
    // If action is not specified, or is 'create', we create a booking
    if (!action || action === "create") {
      // 1. Auth check (optional if user_id is provided, but recommended for security)
      const { data: { user: sessionUser }, error: authErr } = await supabase.auth.getUser();
      
      // Use provided user_id or fallback to session user
      const finalUserId = user_id || sessionUser?.id;

      if (!finalUserId) {
        return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
      }

      // 2. Validate required fields
      if (!device_id || !start_time || !end_time || !total_price) {
        return NextResponse.json({ error: "Missing required fields: device_id, start_time, end_time, total_price" }, { status: 400 });
      }

      console.log("[Bookings] Creating booking for user:", finalUserId, "device:", device_id);

      // Fetch device details for orchestration
      const { data: device, error: deviceErr } = await supabase
        .from("devices")
        .select("id, type, lender_id, status")
        .eq("id", device_id)
        .single();

      if (deviceErr || !device) {
        return NextResponse.json({ error: "Device not found" }, { status: 404 });
      }

      // --- DOUBLE BOOKING PREVENTION ---
      const { data: conflictingBookings, error: conflictErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("device_id", device_id)
        .in("status", ["pending", "active"])
        .or(`and(start_time.lt.${end_time},end_time.gt.${start_time})`);

      if (conflictErr) {
        console.error("[Bookings] Conflict check error:", conflictErr);
        return NextResponse.json({ error: "Failed to verify device availability" }, { status: 500 });
      }

      if (conflictingBookings && conflictingBookings.length > 0) {
        return NextResponse.json({ error: "Device is currently unavailable for the requested time" }, { status: 409 });
      }
      // ---------------------------------

      // 3. Save booking in Supabase
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          user_id: finalUserId,
          device_id: device_id,
          start_time: start_time,
          end_time: end_time,
          total_price: total_price,
          status: "pending",
        })
        .select()
        .single();

      if (bookingErr) {
        console.error("[Bookings] Insert failed:", bookingErr);
        return NextResponse.json({ error: bookingErr.message }, { status: 500 });
      }

      console.log("[Bookings] Booking created:", booking.id);

      // 4. Return booking_id and optionally a payment redirect hint
      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        // The user asked to redirect to payment page. 
        // We'll return the ID and let the frontend handle the redirect, 
        // or provide a URL if they want the API to decide.
        payment_url: `/api/payments?bookingId=${booking.id}&amount=${total_price}`
      });
    }

    // ─── END SESSION ───
    if (action === "end_session") {
      const { bookingId } = body;
      if (!bookingId) return NextResponse.json({ error: "bookingId مطلوب" }, { status: 400 });

      const { data: booking } = await supabase.from("bookings").select("device_id").eq("id", bookingId).single();
      if (booking) {
        await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);
        await supabase.from("devices").update({ status: "available" }).eq("id", booking.device_id);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // ─── EXTEND SESSION ───
    if (action === "extend_session") {
      const { bookingId } = body;
      if (!bookingId) return NextResponse.json({ error: "bookingId مطلوب" }, { status: 400 });

      const { data: booking } = await supabase.from("bookings").select("end_time, total_price, device_id").eq("id", bookingId).single();
      if (booking) {
        const { data: device } = await supabase.from("devices").select("hourly_price").eq("id", booking.device_id).single();
        const extensionPrice = device ? Number(device.hourly_price) : 0;
        const newEndTime = new Date(new Date(booking.end_time).getTime() + 60 * 60 * 1000);
        const newTotalPrice = Number(booking.total_price || 0) + extensionPrice;

        await supabase.from("bookings").update({ end_time: newEndTime.toISOString(), total_price: newTotalPrice }).eq("id", bookingId);
        return NextResponse.json({ success: true, newEndTime, newTotalPrice });
      }
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("[Bookings] Unhandled error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// GET: Fetch bookings for the current user
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    let query = supabase
      .from("bookings")
      .select("*, devices(name, hourly_price, type, lender_id)")
      .order("created_at", { ascending: false });

    if (role === "lender") {
      const { data: devices } = await supabase.from("devices").select("id").eq("lender_id", user.id);
      const deviceIds = devices?.map(d => d.id) || [];
      if (deviceIds.length > 0) {
        query = query.in("device_id", deviceIds);
      } else {
        return NextResponse.json([]);
      }
    } else {
      query = query.eq("user_id", user.id);
    }

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("[Bookings GET] Unhandled error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
