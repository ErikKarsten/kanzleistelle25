import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL =
  "https://myvjwpbhdnnrkwazudnh.supabase.co/storage/v1/object/public/logos/kanzleistelle24-logo-optimiert.png";
const NEELE_IMG =
  "https://myvjwpbhdnnrkwazudnh.supabase.co/storage/v1/object/public/logos/Neele%20Business.jpg";

const fmt = (n: number) => n.toLocaleString("de-DE") + " €";

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior (0–2 Jahre)",
  mid: "Mid-Level (2–5 Jahre)",
  senior: "Senior (5+ Jahre)",
};

function buildEmailHtml(params: {
  name: string;
  beruf: string;
  erfahrung: string;
  bundesland: string;
  currentSalary: number | null;
  median: number;
  salaryMax: number;
}): string {
  const { name, beruf, bundesland, currentSalary, median, salaryMax } = params;
  const erfahrungLabel = LEVEL_LABELS[params.erfahrung] ?? params.erfahrung;

  let vergleichsBlock = "";

  if (median === 0) {
    vergleichsBlock = `
      <div style="background:#f9fafb;border-left:4px solid #9ca3af;padding:16px 20px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;font-size:16px;color:#374151;font-weight:600;">
          📊 Marktdaten werden aufgebaut
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">
          Für deine Kombination aus Beruf, Erfahrung und Region haben wir noch keine
          Vergleichsdaten. Melde dich gerne direkt bei uns — wir helfen dir persönlich weiter.
        </p>
      </div>`;
  } else if (!currentSalary) {
    vergleichsBlock = `
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;font-size:16px;color:#1d4ed8;font-weight:600;">
          📊 Dein Marktüberblick
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#1e40af;">
          Der Marktdurchschnitt für <strong>${beruf}</strong> (${erfahrungLabel})
          in <strong>${bundesland}</strong> liegt bei <strong>${fmt(median)}</strong>
          Jahresbrutto. Top-Kanzleien zahlen bis zu <strong>${fmt(salaryMax)}</strong>.
        </p>
      </div>`;
  } else if (currentSalary < median * 0.9) {
    const diff = median - currentSalary;
    vergleichsBlock = `
      <div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;font-size:16px;color:#9a3412;font-weight:600;">
          📈 Dein Gehalt liegt ${fmt(diff)} unter dem Marktdurchschnitt
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#c2410c;">
          Der Durchschnitt für ${beruf} (${erfahrungLabel}) in ${bundesland}
          beträgt ${fmt(median)}. Ein Wechsel könnte sich deutlich lohnen.
        </p>
      </div>`;
  } else if (currentSalary <= salaryMax) {
    vergleichsBlock = `
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;font-size:16px;color:#1d4ed8;font-weight:600;">
          ⚖️ Du liegst gut im Markt
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#1e40af;">
          Dein Gehalt entspricht in etwa dem Marktdurchschnitt von ${fmt(median)} für ${beruf} in ${bundesland}.
          Top-Kanzleien zahlen bis zu ${fmt(salaryMax)} — und bieten oft zusätzlich
          Homeoffice, flexible Zeiten und Weiterbildungsbudgets.
        </p>
      </div>`;
  } else {
    vergleichsBlock = `
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px 20px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;font-size:16px;color:#15803d;font-weight:600;">
          🏆 Du gehörst zu den Top-Verdienern!
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#166534;">
          Dein Gehalt liegt über dem Marktdurchschnitt von ${fmt(median)} für ${beruf} in ${bundesland}.
          Neben dem Gehalt lohnt es sich, auch auf Entwicklungsperspektiven,
          Teamkultur und Flexibilität zu achten.
        </p>
      </div>`;
  }

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://kanzleistelle24.de" style="text-decoration:none;">
        <img src="${LOGO_URL}" alt="Kanzleistelle24" width="210" style="display:inline-block;max-width:210px;width:100%;height:auto;margin:0;" />
      </a>
    </div>
    <h2>Hallo ${name},</h2>
    <p>danke, dass du unseren Gehaltscheck genutzt hast! Hier deine persönliche Auswertung:</p>
    ${vergleichsBlock}
    <h3>💡 3 Tipps für dein nächstes Gehaltsgespräch:</h3>
    <ul>
      <li><strong>Zahlen mitbringen:</strong> Verweise auf Branchendaten (wie unseren Gehaltscheck) statt nur "Gefühl".</li>
      <li><strong>Nicht nur Grundgehalt verhandeln:</strong> Homeoffice-Tage, Weiterbildungsbudget und Zusatzurlaub sind oft leichter zu bekommen als mehr Fixgehalt.</li>
      <li><strong>Timing nutzen:</strong> Nach erfolgreichem Projektabschluss oder in der Jahresplanung stehen die Chancen am besten.</li>
    </ul>
    <div style="background:#f5f5f0;border-radius:12px;padding:18px 20px;margin:24px 0;display:flex;align-items:center;gap:16px;">
      <img src="${NEELE_IMG}" alt="Neele Ehlers"
           width="64" height="64"
           style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0;" />
      <div>
        <p style="font-size:14px;font-weight:600;margin:0 0 2px;color:#1a1a1a;">Neele Ehlers</p>
        <p style="font-size:12px;color:#666;margin:0 0 6px;">Deine Ansprechpartnerin bei Kanzleistelle24</p>
        <p style="font-size:13px;line-height:1.5;color:#333;margin:0;">
          „Ich kümmere mich persönlich um deine Anfrage und melde mich,
          sobald eine passende Stelle für dich dabei ist."
        </p>
      </div>
    </div>
    <p style="text-align:center;">
      <a href="https://kanzleistelle24.de/#stellenangebote"
         style="background:#00AEEF;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">
        Passende Stellen ansehen →
      </a>
    </p>
    <p style="font-size:12px;color:#888;margin-top:30px;">
      Kanzleistelle24 | Frankfurter Str. 284, 38122 Braunschweig<br/>
      <a href="{{unsubscribe}}">Abmelden</a>
    </p>
  </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, telefon, beruf, erfahrung, bundesland, currentSalary } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: salaryData } = await supabase
      .from("salary_data")
      .select("salary_median, salary_max")
      .eq("job_type", beruf)
      .eq("experience_level", erfahrung)
      .eq("bundesland", bundesland)
      .single();

    const median = salaryData?.salary_median ?? 0;
    const salaryMax = salaryData?.salary_max ?? 0;

    const htmlContent = buildEmailHtml({
      name,
      beruf,
      erfahrung,
      bundesland,
      currentSalary: currentSalary ? Number(currentSalary) : null,
      median,
      salaryMax,
    });

    const mailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": Deno.env.get("BREVO_API_KEY") ?? "",
      },
      body: JSON.stringify({
        sender: { name: "Kanzleistelle24", email: "hallo@kanzleistelle24.de" },
        to: [{ email, name }],
        subject: `Dein Gehaltscheck-Ergebnis: ${beruf} in ${bundesland}`,
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
    console.error("send-salary-tips error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
