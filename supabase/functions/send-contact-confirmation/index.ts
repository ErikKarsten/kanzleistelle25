import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL =
  "https://myvjwpbhdnnrkwazudnh.supabase.co/storage/v1/object/public/logos/kanzleistelle24-logo-optimiert.png";
const NEELE_IMG = "https://kanzleistelle24.de/assets/neele-ehlers-DEfSZMRV.webp";

function buildEmailHtml(params: { name: string }): string {
  const { name } = params;
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://kanzleistelle24.de" style="text-decoration:none;">
        <img src="${LOGO_URL}" alt="Kanzleistelle24" width="210" style="display:inline-block;max-width:210px;width:100%;height:auto;margin:0;" />
      </a>
    </div>
    <h2>Hallo ${name},</h2>
    <p>vielen Dank für deine Nachricht bei Kanzleistelle24! Ich habe sie gerade erhalten und melde mich innerhalb von 1-2 Werktagen persönlich bei dir zurück.</p>
    <div style="background:#f5f5f0;border-radius:12px;padding:18px 20px;margin:24px 0;display:flex;align-items:center;gap:16px;">
      <img src="${NEELE_IMG}" alt="Neele Ehlers"
           width="64" height="64"
           style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0;" />
      <div>
        <p style="font-size:14px;font-weight:600;margin:0 0 2px;color:#1a1a1a;">Neele Ehlers</p>
        <p style="font-size:12px;color:#666;margin:0 0 6px;">Deine Ansprechpartnerin bei Kanzleistelle24</p>
        <p style="font-size:13px;line-height:1.5;color:#333;margin:0;">
          „Ich kümmere mich persönlich um deine Anfrage und melde mich in Kürze bei dir."
        </p>
      </div>
    </div>
    <p style="font-size:12px;color:#888;margin-top:30px;">
      Kanzleistelle24 | Frankfurter Str. 284, 38122 Braunschweig
    </p>
  </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "email ist erforderlich." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[send-contact-confirmation] email:", email);

    const htmlContent = buildEmailHtml({ name: name || "" });

    const mailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": Deno.env.get("BREVO_API_KEY") ?? "",
      },
      body: JSON.stringify({
        sender: { name: "Neele von Kanzleistelle24", email: "hallo@kanzleistelle24.de" },
        to: [{ email, name: name || email }],
        subject: "Danke für deine Nachricht! 🎉",
        htmlContent,
      }),
    });

    if (!mailRes.ok) {
      const err = await mailRes.text();
      throw new Error(`Brevo error: ${err}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-contact-confirmation error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
