import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { full_name, email, phone, message, source_url } = await req.json();

    // Build a simple HTML email
    const html = `
      <h2>Neue Kontaktanfrage über Kanzleistelle24</h2>
      <table style="border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${full_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">E-Mail:</td><td><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Telefon:</td><td>${phone}</td></tr>` : ""}
        ${source_url ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Seite:</td><td>${source_url}</td></tr>` : ""}
      </table>
      <h3>Nachricht:</h3>
      <p style="white-space:pre-wrap;">${message}</p>
    `;

    // Use Supabase's built-in SMTP / inbucket or a simple fetch to an SMTP relay
    // We'll use the Resend-style approach via LOVABLE_API_KEY if available,
    // otherwise fall back to logging
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Kanzleistelle24 <noreply@kanzleistelle24.de>",
          to: ["n.ehlers@endlich-mitarbeiter.de"],
          subject: `Neue Kontaktanfrage von ${full_name}`,
          html,
          reply_to: email,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Resend error:", res.status, errBody);
        // Don't fail the request – lead is already saved in DB
      } else {
        console.log("Email sent successfully to n.ehlers@endlich-mitarbeiter.de");
      }
    } else {
      console.warn("RESEND_API_KEY not set – skipping email notification. Lead is saved in DB.");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-new-lead:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
