import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { title, company, description } = await req.json();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Schreibe diese Stellenanzeigen-Beschreibung professionell um für ein deutsches Karriereportal.\n\nFormatierungsregeln:\n- KEIN Markdown (keine **, keine --, keine ##)\n- Strukturiere den Text in 3-4 kurze Absätze (Über uns, Aufgaben, Benefits)\n- Jeder Absatz hat eine Überschrift mit einem passenden Emoji davor, z.B. "🏢 Über uns", "📋 Ihre Aufgaben", "✨ Das bieten wir"\n- Zwischen Absätzen eine Leerzeile\n- Innerhalb der Benefits-Liste: ein Emoji pro Punkt, eine Zeile pro Benefit\n- Keine Ausrufezeichen, kein Social-Media-Ton, keine Fragen\n- Professionell aber einladend\n- Behalte alle Inhalte bei\n\nAntworte NUR mit dem umgeschriebenen Text, kein Kommentar, kein Intro.\n\nStellentitel: ${title}\nUnternehmen: ${company}\n\nBeschreibung:\n${description}`,
        }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
