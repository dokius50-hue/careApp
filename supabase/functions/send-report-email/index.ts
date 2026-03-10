import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ReportPayload = {
  orgName: string;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  reportData: Record<string, unknown>;
};

type RequestBody = {
  to: string;
  payload: ReportPayload;
};

const renderHtml = (body: RequestBody) => {
  const { to, payload } = body;
  const { orgName, dateFrom, dateTo, generatedAt } = payload;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>Caritas report</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: #f9fafb; padding: 24px;">
    <h1 style="font-size: 20px; margin-bottom: 4px;">Caritas report for ${orgName}</h1>
    <p style="margin: 0 0 8px 0; font-size: 14px;">
      Period: <strong>${dateFrom}</strong> to <strong>${dateTo}</strong>
    </p>
    <p style="margin: 0 0 16px 0; font-size: 12px; color: #6b7280;">
      Generated: ${generatedAt}
    </p>
    <p style="margin: 0 0 12px 0; font-size: 14px;">
      This email was sent to <strong>${to}</strong> from CaritasApp. To see the full formatted report,
      you can also export it as PDF directly in the app.
    </p>
  </body>
</html>`;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    if (!body?.to || typeof body.to !== 'string') {
      return new Response(
        JSON.stringify({ error: 'to is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const html = renderHtml(body);
      const fromAddress = Deno.env.get('REPORT_FROM_EMAIL') ?? 'reports@shopeto.org';

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [body.to],
          subject: 'Caritas report',
          html,
        }),
      });

      if (!resendRes.ok) {
        const text = await resendRes.text();
        return new Response(
          JSON.stringify({ error: 'Failed to send email', providerResponse: text }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

