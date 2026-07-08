import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_APPLICATION_AGE_MS = 60 * 60 * 1000; // 1 Stunde

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { applicationId, filePath } = await req.json();

    if (typeof applicationId !== "string" || !UUID_REGEX.test(applicationId)) {
      return jsonResponse({ error: "Ungültige applicationId" }, 400);
    }

    // filePath muss dem Muster aus ApplySuccessStep.tsx entsprechen (applications/<applicationId>_...),
    // sonst könnte jemand den Storage-Pfad einer fremden Bewerbung verknüpfen.
    if (typeof filePath !== "string" || !filePath.startsWith(`applications/${applicationId}_`)) {
      return jsonResponse({ error: "Ungültiger filePath" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, resume_url, created_at")
      .eq("id", applicationId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!application) {
      return jsonResponse({ error: "Bewerbung nicht gefunden" }, 404);
    }

    if (application.resume_url) {
      return jsonResponse({ error: "Für diese Bewerbung wurde bereits ein Lebenslauf hinterlegt" }, 409);
    }

    if (!application.created_at || Date.now() - new Date(application.created_at).getTime() > MAX_APPLICATION_AGE_MS) {
      return jsonResponse({ error: "Zeitfenster für den Upload ist abgelaufen" }, 403);
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({ resume_url: filePath })
      .eq("id", applicationId);

    if (updateError) throw updateError;

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("attach-resume error:", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
