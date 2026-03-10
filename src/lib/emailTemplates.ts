/**
 * Branded HTML email templates for Kanzleistelle24.
 * All styles are inline for maximum email-client compatibility.
 *
 * Colors:
 *   Primary:    #003366 (Dunkelblau)
 *   Accent:     #00AEEF (Hellblau)
 *   Background: #F4F7F6
 */

const YEAR = new Date().getFullYear();
const DASHBOARD_URL = "https://kanzleistelle24.de";
const LOGO_URL =
  "https://myvjwpbhdnnrkwazudnh.supabase.co/storage/v1/object/public/logos/Kanzleistelle24%20Logo.png";

/* ------------------------------------------------------------------ */
/* Shared layout                                                       */
/* ------------------------------------------------------------------ */

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);max-width:600px;width:100%;">

  <!-- BODY -->
  <tr><td style="padding:36px 32px 12px;">
    ${body}

    <!-- SIGN-OFF + LOGO -->
    <p style="margin:28px 0 12px;font-size:15px;color:#4A5568;line-height:1.5;">
      Viele Grüße<br/>
      <strong style="color:#003366;">Dein Team von Kanzleistelle24</strong>
    </p>
    <a href="${DASHBOARD_URL}" style="text-decoration:none;">
      <img src="${LOGO_URL}" alt="Kanzleistelle24" height="150" style="display:block;max-height:150px;width:auto;margin:0 0 20px;" />
    </a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#F4F7F6;padding:20px 32px;text-align:center;border-top:1px solid #E2E8F0;">
    <p style="margin:0 0 6px;font-size:12px;color:#718096;">© ${YEAR} Kanzleistelle24 · Alle Rechte vorbehalten</p>
    <p style="margin:0;font-size:12px;color:#A0AEC0;">
      <a href="${DASHBOARD_URL}/impressum" style="color:#00AEEF;text-decoration:none;">Impressum</a>
      &nbsp;·&nbsp;
      <a href="${DASHBOARD_URL}/datenschutz" style="color:#00AEEF;text-decoration:none;">Datenschutz</a>
    </p>
    <p style="margin:10px 0 0;font-size:11px;color:#CBD5E0;">
      Sie erhalten diese E-Mail, weil Sie bei Kanzleistelle24 registriert sind.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

function ctaButton(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
    <td style="background:#00AEEF;border-radius:6px;padding:14px 28px;">
      <a href="${href}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;display:inline-block;">${label}</a>
    </td>
  </tr></table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 12px 6px 0;font-weight:600;color:#003366;font-size:14px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:#4A5568;font-size:14px;">${value}</td>
  </tr>`;
}

/* ------------------------------------------------------------------ */
/* Template A – Neue Bewerbung (an die Kanzlei)                        */
/* ------------------------------------------------------------------ */

interface NewApplicationData {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantRole: string;
  jobTitle: string;
  companyName: string;
}

export function buildNewApplicationEmail(data: NewApplicationData) {
  const body = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#003366;">Neue Bewerbung eingegangen</p>
    <p style="margin:0 0 20px;font-size:15px;color:#4A5568;line-height:1.6;">
      Für Ihre Stelle <strong style="color:#003366;">${data.jobTitle}</strong> ist eine neue Bewerbung eingegangen.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background:#F4F7F6;border-radius:8px;padding:4px 0;margin-bottom:8px;">
      ${infoRow("Bewerber/in:", data.applicantName)}
      ${infoRow("E-Mail:", data.applicantEmail)}
      ${infoRow("Telefon:", data.applicantPhone || "–")}
      ${infoRow("Rolle:", data.applicantRole || "–")}
    </table>

    ${ctaButton("Bewerbung ansehen →", `${DASHBOARD_URL}/arbeitgeber`)}

    <p style="margin:0;font-size:13px;color:#A0AEC0;line-height:1.5;">
      Diese E-Mail wurde automatisch versendet. Sie können direkt über Ihr Dashboard auf die Bewerbung reagieren.
    </p>`;

  return {
    subject: `Neue Bewerbung: ${data.applicantName} für ${data.jobTitle}`,
    html: wrap(body),
  };
}

/* ------------------------------------------------------------------ */
/* Template B – Profil-Update (an die Kanzlei)                         */
/* ------------------------------------------------------------------ */

interface ProfileUpdateData {
  applicantName: string;
  jobTitle: string;
  companyName: string;
  updatedFields?: string[];
}

export function buildProfileUpdateEmail(data: ProfileUpdateData) {
  const fieldsList = data.updatedFields?.length
    ? `<ul style="margin:12px 0 20px;padding-left:20px;color:#4A5568;font-size:14px;line-height:1.8;">
        ${data.updatedFields.map((f) => `<li>${f}</li>`).join("")}
       </ul>`
    : "";

  const body = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#003366;">Bewerberprofil aktualisiert</p>
    <p style="margin:0 0 16px;font-size:15px;color:#4A5568;line-height:1.6;">
      <strong style="color:#003366;">${data.applicantName}</strong> hat sein Bewerberprofil für die Stelle
      <strong style="color:#003366;">${data.jobTitle}</strong> aktualisiert.
    </p>
    ${fieldsList}

    ${ctaButton("Profil ansehen →", `${DASHBOARD_URL}/arbeitgeber`)}

    <p style="margin:0;font-size:13px;color:#A0AEC0;line-height:1.5;">
      Sie erhalten diese Benachrichtigung, weil der Bewerber Änderungen an seinem Profil vorgenommen hat.
    </p>`;

  return {
    subject: `Profil-Update: ${data.applicantName} – ${data.jobTitle}`,
    html: wrap(body),
  };
}

/* ------------------------------------------------------------------ */
/* Template C – Bestätigung an den Bewerber (Profil gespeichert)        */
/* ------------------------------------------------------------------ */

interface ApplicantConfirmationData {
  applicantName: string;
}

export function buildApplicantConfirmationEmail(data: ApplicantConfirmationData) {
  const body = `
    <p style="margin:0 0 16px;font-size:16px;color:#2D3748;">Hallo ${data.applicantName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#4A5568;line-height:1.6;">
      dein Bewerberprofil wurde erfolgreich aktualisiert. Arbeitgeber können ab sofort deine aktuellen Angaben einsehen.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#4A5568;line-height:1.6;">
      Je vollständiger dein Profil ist, desto besser stehen deine Chancen auf eine Einladung zum Vorstellungsgespräch.
    </p>

    ${ctaButton("Zum Dashboard →", `${DASHBOARD_URL}/bewerber`)}`;

  return {
    subject: "Deine Bewerbung bei Kanzleistelle24 – Profil aktualisiert",
    html: wrap(body),
  };
}

/* ------------------------------------------------------------------ */
/* Template D – Willkommens-E-Mail für neue Bewerber                   */
/* ------------------------------------------------------------------ */

interface WelcomeApplicantData {
  firstName?: string;
}

export function buildWelcomeApplicantEmail(data: WelcomeApplicantData) {
  const greeting = data.firstName ? `Hallo ${data.firstName}` : "Herzlich willkommen";

  function step(num: number, title: string, desc: string): string {
    return `<tr>
      <td style="width:44px;vertical-align:top;padding:0 16px 20px 0;">
        <div style="width:36px;height:36px;border-radius:50%;background:#00AEEF;color:#ffffff;font-size:16px;font-weight:700;line-height:36px;text-align:center;">${num}</div>
      </td>
      <td style="vertical-align:top;padding:0 0 20px;">
        <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#003366;">${title}</p>
        <p style="margin:0;font-size:14px;color:#4A5568;line-height:1.5;">${desc}</p>
      </td>
    </tr>`;
  }

  const body = `
    <p style="margin:0 0 16px;font-size:16px;color:#2D3748;">${greeting}! 🎉</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4A5568;line-height:1.6;">
      Schön, dass du dich bei <strong style="color:#003366;">Kanzleistelle24</strong> registriert hast – deiner Karriereplattform für Steuerkanzleien. Dein Konto ist jetzt aktiv!
    </p>

    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#003366;">So geht's weiter:</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      ${step(1, "Profil vervollständigen", "Lade deinen Lebenslauf hoch und ergänze Fachkenntnisse, Gehaltsvorstellung und Eintrittsdatum.")}
      ${step(2, "Passende Stellen entdecken", "Durchstöbere aktuelle Stellenangebote aus Steuerkanzleien in deiner Region.")}
      ${step(3, "Direkt bewerben", "Bewirb dich mit einem Klick – dein Profil wird automatisch übermittelt.")}
    </table>

    ${ctaButton("Jetzt Profil vervollständigen →", `${DASHBOARD_URL}/bewerber`)}

    <p style="margin:0;font-size:13px;color:#A0AEC0;line-height:1.5;">
      Bei Fragen erreichst du uns jederzeit unter <a href="mailto:info@kanzleistelle24.de" style="color:#00AEEF;text-decoration:none;">info@kanzleistelle24.de</a>.
    </p>`;

  return {
    subject: "Willkommen bei Kanzleistelle24 – Dein Karrierestart! 🚀",
    html: wrap(body),
  };
}
