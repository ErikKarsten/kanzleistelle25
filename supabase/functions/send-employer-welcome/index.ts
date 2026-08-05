import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL =
  "https://myvjwpbhdnnrkwazudnh.supabase.co/storage/v1/object/public/logos/kanzleistelle24-logo-optimiert.png";
const NEELE_IMG = "https://kanzleistelle24.de/assets/neele-ehlers-DEfSZMRV.webp";
const LOGIN_URL = "https://kanzleistelle24.de/login";

function buildEmailHtml(params: { companyName: string }): string {
  const { companyName } = params;
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://kanzleistelle24.de" style="text-decoration:none;">
        <img src="${LOGO_URL}" alt="Kanzleistelle24" width="210" style="display:inline-block;max-width:210px;width:100%;height:auto;margin:0;" />
      </a>
    </div>
    <h2>Willkommen bei Kanzleistelle24, ${companyName}!</h2>
    <p>schön, dass ihr euch registriert habt! Euer Kanzlei-Konto ist jetzt angelegt und ihr könnt direkt loslegen.</p>
    <p>Kurzer Hinweis: Neue Stellenanzeigen werden von unserem Team geprüft, bevor sie öffentlich sichtbar werden – das dauert in der Regel nicht länger als einen Werktag.</p>
    <div style="background:#f5f5f0;border-radius:12px;padding:18px 20px;margin:24px 0;display:flex;align-items:center;gap:16px;">
      <img src="${NEELE_IMG}" alt="Neele Ehlers"
           width="64" height="64"
           style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0;" />
      <div>
        <p style="font-size:14px;font-weight:600;margin:0 0 2px;color:#1a1a1a;">Neele Ehlers</p>
        <p style="font-size:12px;color:#666;margin:0 0 6px;">Deine Ansprechpartnerin bei Kanzleistelle24</p>
        <p style="font-size:13px;line-height:1.5;color:#333;margin:0;">
          „Meldet euch gerne jederzeit bei mir, wenn ich bei etwas helfen kann."
        </p>
      </div>
    </div>
    <p style="text-align:center;">
      <a href="${LOGIN_URL}"
         style="background:#00AEEF;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">
        Zum Dashboard →
      </a>
    </p>
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
    const { companyName, email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "email ist erforderlich." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[send-employer-welcome] email:", email);

    const htmlContent = buildEmailHtml({ companyName: companyName || "" });

    const mailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": Deno.env.get("BREVO_API_KEY") ?? "",
      },
      body: JSON.stringify({
        sender: { name: "Neele von Kanzleistelle24", email: "hallo@kanzleistelle24.de" },
        to: [{ email, name: companyName || email }],
        subject: "Willkommen bei Kanzleistelle24! 🎉",
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
    console.error("send-employer-welcome error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
