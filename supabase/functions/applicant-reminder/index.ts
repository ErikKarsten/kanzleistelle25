import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Email template (inline to avoid cross-module imports in edge functions) ──

const YEAR = new Date().getFullYear();
const DASHBOARD_URL = "https://kanzleistelle24.de";
const LOGO_URL =
  "https://myvjwpbhdnnrkwazudnh.supabase.co/storage/v1/object/public/logos/Kanzleistelle24%20Logo.png";
const NEELE_IMG =
  "https://myvjwpbhdnnrkwazudnh.supabase.co/storage/v1/object/public/logos/Neele%20Business.jpg";

function buildReminderEmail(
  companyName: string,
  applicants: Array<{ name: string; jobTitle: string; daysWaiting: number }>
) {
  const rows = applicants
    .map(
      (a) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#2D3748;">${a.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#4A5568;">${a.jobTitle}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:14px;text-align:center;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${a.daysWaiting > 7 ? "#E53E3E" : "#ECC94B"};margin-right:6px;vertical-align:middle;"></span>
            ${a.daysWaiting} Tage
          </td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);max-width:600px;width:100%;">
  <tr><td style="padding:36px 32px 12px;">
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#003366;">Bewerber warten auf Ihre Rückmeldung</p>
    <p style="margin:0 0 20px;font-size:15px;color:#4A5568;line-height:1.6;">
      Guten Tag,<br/>
      Sie haben Bewerber, die seit über 4 Tagen auf eine Rückmeldung warten. Ein schnelles Feedback erhöht Ihre Chancen auf eine erfolgreiche Einstellung deutlich!
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#F4F7F6;">
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#003366;font-weight:700;border-bottom:2px solid #003366;">Bewerber</th>
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#003366;font-weight:700;border-bottom:2px solid #003366;">Stelle</th>
          <th style="padding:10px 12px;text-align:center;font-size:13px;color:#003366;font-weight:700;border-bottom:2px solid #003366;">Wartezeit</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
      <td style="background:#00AEEF;border-radius:6px;padding:14px 28px;">
        <a href="${DASHBOARD_URL}/login" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;display:inline-block;">Jetzt antworten →</a>
      </td>
    </tr></table>
    <p style="margin:0;font-size:13px;color:#A0AEC0;line-height:1.5;">
      Diese E-Mail wurde automatisch versendet, weil offene Bewerbungen bei ${companyName} auf eine Reaktion warten.
    </p>

    <!-- SEPARATOR -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:32px 0 0;">
      <tr><td style="padding:0;">
        <div style="height:2px;background:linear-gradient(90deg,#00AEEF 0%,#E2E8F0 40%,transparent 100%);border-radius:2px;"></div>
      </td></tr>
    </table>

    <!-- SIGNATURE -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:24px 0 0;">
      <tr>
        <td style="vertical-align:top;padding:0 20px 0 0;">
          <p style="margin:0 0 4px;font-size:15px;color:#4A5568;line-height:1.5;">Mit freundlichen Grüßen,</p>
          <p style="margin:0 0 2px;font-size:22px;color:#003366;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;">Neele Ehlers</p>
          <p style="margin:0 0 24px;font-size:13px;color:#718096;line-height:1.4;">Ihre persönliche Ansprechpartnerin<br/>bei Kanzleistelle24</p>
          <a href="${DASHBOARD_URL}" style="text-decoration:none;">
            <img src="${LOGO_URL}" alt="Kanzleistelle24" width="210" style="display:block;max-width:210px;width:100%;height:auto;margin:0;" />
          </a>
        </td>
        <td style="vertical-align:top;width:200px;text-align:right;">
          <table cellpadding="0" cellspacing="0" style="margin:0 0 0 auto;">
            <tr><td style="text-align:center;">
              <div style="width:190px;height:190px;border-radius:50%;background:radial-gradient(circle at 60% 40%,rgba(0,174,239,0.25) 0%,rgba(0,51,102,0.10) 70%,transparent 100%);display:flex;align-items:center;justify-content:center;margin:0 auto;">
                <img src="${NEELE_IMG}" alt="Neele Ehlers" width="180" height="180" style="display:block;width:180px;height:180px;border-radius:50%;object-fit:cover;box-shadow:0 6px 24px rgba(0,51,102,0.20);border:3px solid #ffffff;margin:5px;" />
              </div>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="height:20px;"></div>
  </td></tr>

  <tr><td style="background:#F4F7F6;padding:20px 32px;text-align:center;border-top:1px solid #E2E8F0;">
    <p style="margin:0 0 6px;font-size:12px;color:#718096;">© ${YEAR} Kanzleistelle24 · Alle Rechte vorbehalten</p>
    <p style="margin:0;font-size:12px;color:#A0AEC0;">
      <a href="${DASHBOARD_URL}/impressum" style="color:#00AEEF;text-decoration:none;">Impressum</a>
      &nbsp;·&nbsp;
      <a href="${DASHBOARD_URL}/datenschutz" style="color:#00AEEF;text-decoration:none;">Datenschutz</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return {
    subject: `⏰ ${applicants.length} Bewerber warten auf Rückmeldung – ${companyName}`,
    html,
  };
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find all non-archived applications where updated_at is older than 4 days
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleApps, error: fetchErr } = await supabase
      .from("applications")
      .select("id, first_name, last_name, updated_at, company_id, job_id, jobs(title), status")
      .eq("is_archived", false)
      .lt("updated_at", fourDaysAgo)
      .in("status", ["pending", "reviewing"]);

    if (fetchErr) {
      console.error("[applicant-reminder] fetch error:", fetchErr);
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!staleApps || staleApps.length === 0) {
      console.log("[applicant-reminder] No stale applications found.");
      return new Response(JSON.stringify({ success: true, message: "No reminders needed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by company_id
    const byCompany = new Map<string, typeof staleApps>();
    for (const app of staleApps) {
      const cid = app.company_id;
      if (!cid) continue;
      if (!byCompany.has(cid)) byCompany.set(cid, []);
      byCompany.get(cid)!.push(app);
    }

    // Fetch company details for all relevant companies
    const companyIds = Array.from(byCompany.keys());
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, user_id")
      .in("id", companyIds)
      .eq("is_active", true);

    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No active companies" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get employer emails from profiles
    const userIds = companies.map((c) => c.user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p.email]) || []);

    let emailsSent = 0;

    for (const company of companies) {
      const apps = byCompany.get(company.id);
      if (!apps || apps.length === 0) continue;

      const applicants = apps.map((a) => {
        const diffMs = Date.now() - new Date(a.updated_at!).getTime();
        const daysWaiting = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return {
          name: `${a.first_name || ""} ${a.last_name || ""}`.trim() || "Unbekannt",
          jobTitle: (a.jobs as any)?.title || "Unbekannte Stelle",
          daysWaiting,
        };
      });

      const email = buildReminderEmail(company.name, applicants);

      // Send to employer email (from profiles) and also admin
      const employerEmail = company.user_id ? profileMap.get(company.user_id) : null;
      const recipients = [employerEmail, "info@kanzleistelle24.de"].filter(Boolean);
      const uniqueRecipients = [...new Set(recipients)];

      for (const toEmail of uniqueRecipients) {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: "Kanzleistelle24", email: "info@kanzleistelle24.de" },
            to: [{ email: toEmail, name: company.name }],
            subject: email.subject,
            htmlContent: email.html,
          }),
        });

        if (!res.ok) {
          console.error(`[applicant-reminder] Brevo error for ${toEmail}:`, await res.text());
        } else {
          emailsSent++;
          console.log(`[applicant-reminder] Sent reminder to ${toEmail} for ${company.name}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent, companiesProcessed: companies.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[applicant-reminder] Unexpected error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
