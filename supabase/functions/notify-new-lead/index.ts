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

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

    if (BREVO_API_KEY) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Kanzleistelle24", email: "info@kanzleistelle24.de" },
          to: [{ email: "info@kanzleistelle24.de", name: "Kanzleistelle24 Team" }],
          subject: `📬 Neue Kontaktanfrage von ${full_name}`,
          htmlContent: html,
          replyTo: { email: email, name: full_name },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Brevo error:", res.status, errBody);
      } else {
        console.log("Email sent successfully to info@kanzleistelle24.de");
      }
    } else {
      console.warn("BREVO_API_KEY not set – skipping email notification. Lead is saved in DB.");
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