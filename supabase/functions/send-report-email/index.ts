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

const SITE_URL = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://shopeto.org';

const renderHtml = (body: RequestBody) => {
  const { to, payload } = body;
  const { orgName, dateFrom, dateTo, generatedAt } = payload;
  const openAppUrl = `${SITE_URL.replace(/\/$/, '')}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>Your Shopeto report</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body style="margin: 0; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; background: #f8fafc; padding: 24px;">
    <div style="max-width: 480px; margin: 0 auto;">
      <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); padding: 28px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #64748b;">Shopeto</p>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; background: linear-gradient(90deg, #0d9488, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Your report is ready</h1>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #475569;">
          This is a summary of the report for <strong>${orgName}</strong> for the period you selected. Open the app to view the full report or export it as PDF.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; color: #334155;">
          <tr><td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">Period</td><td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; text-align: right;"><strong>${dateFrom}</strong> to <strong>${dateTo}</strong></td></tr>
          <tr><td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">Generated</td><td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${generatedAt}</td></tr>
          <tr><td style="padding: 6px 0;">Sent to</td><td style="padding: 6px 0; text-align: right;">${to}</td></tr>
        </table>
        <p style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; color: #0f172a;">What to do next</p>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #475569;">
          Open Shopeto to see the full report, charts, and export a PDF if needed.
        </p>
        <a href="${openAppUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 600; color: #ffffff; background: linear-gradient(90deg, #0d9488, #7c3aed); border-radius: 9999px; text-decoration: none; box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);">Open Shopeto</a>
      </div>
      <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">You received this because a report was sent to this address from Shopeto.</p>
    </div>
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
          subject: 'Shopeto report',
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

