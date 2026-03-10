import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to_email: string;
  to_name: string;
  subject: string;
  html: string;
  from_email?: string;
  from_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, to_name, subject, html, from_email, from_name } =
      (await req.json()) as EmailRequest;

    if (!to_email || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to_email, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      console.error("[send-contact-email] BREVO_API_KEY not set");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = {
      sender: {
        name: from_name || "Kanzleistelle24",
        email: from_email || "info@kanzleistelle24.de",
      },
      to: [{ email: to_email, name: to_name || to_email }],
      subject,
      htmlContent: html,
    };

    console.log("[send-contact-email] Sending to:", to_email, "subject:", subject);

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await res.text();

    if (!res.ok) {
      console.error("[send-contact-email] Brevo error:", res.status, body);
      return new Response(
        JSON.stringify({ success: false, error: `Brevo API error: ${res.status}`, details: body }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[send-contact-email] Sent successfully:", body);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-contact-email] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
