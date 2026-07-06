import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { candidate } = await req.json();

    // Claude API aufrufen
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `Erstelle einen professionellen deutschen Lebenslauf als HTML mit Inline-Styles.
Nutze dunkelblauer Akzentfarbe (#1a2744). Nur HTML zurückgeben, kein Markdown.

Position: ${candidate.position || candidate.applicant_role || "Steuerfachangestellte"}
Erfahrung: ${candidate.experience_years || candidate.experience || "k.A."} Jahre
Standort: ${candidate.location || "Deutschland"}

Verwende als Platzhalter:
- Name: [Name des Kandidaten]
- E-Mail: [E-Mail-Adresse]
- Telefon: [Telefonnummer]

Erstelle: 1. Header 2. Profil 3. Berufserfahrung 4. Ausbildung 5. Skills.
Nur HTML mit Inline-Styles, A4-Format.`
        }]
      })
    });

    const claudeData = await claudeRes.json();
    const html = claudeData.content?.[0]?.text ?? "";

    if (!html) {
      throw new Error("Keine Antwort von Claude");
    }

    // Supabase Client initialisieren
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    // In Storage hochladen
    const fileName = `cv_${candidate.first_name}_${candidate.last_name}_${Date.now()}.html`
      .replace(/\s+/g, "_");

    await supabase.storage
      .from("resumes")
      .upload(fileName, new Blob([html], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true
      });

    const { data: { publicUrl } } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    // URL in applications Tabelle speichern
    if (candidate.id) {
      await supabase
        .from("applications")
        .update({ resume_url: publicUrl })
        .eq("id", candidate.id);
    }

    return new Response(JSON.stringify({ html, resume_url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("Fehler:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
