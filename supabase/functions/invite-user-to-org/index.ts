import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid Authorization' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await req.json()) as { email?: string; org_id?: string; redirect_to?: string };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const orgId = body.org_id;
    if (!email || !orgId) {
      return new Response(
        JSON.stringify({ error: 'email and org_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: membership } = await userClient
      .from('org_members')
      .select('org_id')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'You are not a member of this organisation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error: insertError } = await admin.from('org_invites').upsert(
      { org_id: orgId, email: email.toLowerCase(), invited_by: user.id },
      { onConflict: 'org_id,email' }
    );
    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const redirectTo = typeof body.redirect_to === 'string' && body.redirect_to
      ? body.redirect_to
      : Deno.env.get('APP_URL') || undefined;

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: redirectTo ? { redirect_to: redirectTo } : undefined,
      redirectTo: redirectTo || undefined
    });
    if (inviteError) {
      await admin.from('org_invites').delete().eq('org_id', orgId).eq('email', email.toLowerCase());
      const msg = inviteError.message || '';
      const friendlyMessage = /already|registered|exists/i.test(msg)
        ? 'This email is already registered. Use Add member above to add them to the organisation.'
        : msg;
      return new Response(
        JSON.stringify({ error: friendlyMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
