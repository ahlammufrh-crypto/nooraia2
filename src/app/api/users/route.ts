import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  // Verify the caller is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  // Security: only allow users to update their own profile
  if (id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Step 1: Check if user row exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .single();

  console.log("[API /users PATCH] Existing user check:", { existingUser, fetchError: fetchError?.message });

  // Step 2: If no row exists, create one first
  if (!existingUser) {
    console.log("[API /users PATCH] User row missing, creating...");
    const { error: insertError } = await supabase
      .from('users')
      .insert({ id: user.id, email: user.email || '', ...updates });

    if (insertError) {
      console.error("[API /users PATCH] Insert failed:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch the newly created row
    const { data: newUser, error: refetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (refetchError) {
      return NextResponse.json({ error: refetchError.message }, { status: 500 });
    }

    return NextResponse.json(newUser);
  }

  // Step 3: Row exists, update it
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select();

  console.log("[API /users PATCH] Update result:", { data, error: error?.message });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No rows updated - RLS may be blocking" }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}
