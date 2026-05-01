import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log("[AuthCallback] User authenticated:", user.id);

        // Check if user row exists in public.users
        const { data: userData, error: fetchErr } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        console.log("[AuthCallback] DB check:", { userData, fetchErr: fetchErr?.message });

        if (!userData) {
          // Row doesn't exist — create it via upsert
          console.log("[AuthCallback] Creating user row...");
          const { error: upsertErr } = await supabase
            .from('users')
            .upsert({ id: user.id, email: user.email || '' }, { onConflict: 'id' });

          if (upsertErr) {
            console.error("[AuthCallback] Upsert failed:", upsertErr);
          }

          // Send to role selection
          return NextResponse.redirect(`${origin}/login/role`);
        }

        if (!userData.role) {
          // Row exists but no role selected
          return NextResponse.redirect(`${origin}/login/role`);
        }

        // Has role — redirect to correct dashboard
        const dest = userData.role === 'lender' ? '/lender-dashboard' : '/dashboard';
        console.log("[AuthCallback] Redirecting to:", dest);
        return NextResponse.redirect(`${origin}${dest}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=InvalidLink`);
}
