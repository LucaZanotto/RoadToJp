// /api/add-donation.js — Vercel Serverless Function (Node 18+)
// Inserisce una donazione manuale (IBAN / Satispay / manual) su Supabase.
// Protetto con token lato server. La Service Role Key resta SOLO su server.

export const config = {
  runtime: "edge" // veloce; puoi passare a "nodejs" se vuoi usare librerie Node
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Autenticazione semplice con Bearer token
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== process.env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Leggi body
  let payload = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { amount_eur, source = "manual", note = "", external_id = null, currency = "EUR", status = "settled" } = payload || {};
  const cents = Math.round(Number(amount_eur) * 100);
  if (!cents || cents < 1) {
    return new Response(JSON.stringify({ error: "Invalid amount_eur" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!["paypal","iban","satispay","manual"].includes(source)) {
    return new Response(JSON.stringify({ error: "Invalid source" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!["pending","settled","refunded"].includes(status)) {
    return new Response(JSON.stringify({ error: "Invalid status" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "Missing server env: SUPABASE_URL or SUPABASE_SERVICE_ROLE" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Insert su PostgREST (bypassa RLS grazie alla Service Role Key)
  const insertBody = [{
    amount_cents: cents,
    currency,
    status,
    source,
    note,
    external_id
  }];

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/donations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE,
      "Authorization": `Bearer ${SERVICE_ROLE}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(insertBody)
  });

  if (!resp.ok) {
    const detail = await resp.text();
    return new Response(JSON.stringify({ error: "DB insert failed", detail }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const data = await resp.json();
  return new Response(JSON.stringify({ ok: true, donation: data?.[0] || null }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
