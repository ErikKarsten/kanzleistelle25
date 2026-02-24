import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find companies whose last_sign_in_at is older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: staleCompanies, error: fetchError } = await supabase
      .from("companies")
      .select("id, name")
      .eq("is_active", true)
      .lt("last_sign_in_at", ninetyDaysAgo.toISOString());

    if (fetchError) throw fetchError;

    if (!staleCompanies || staleCompanies.length === 0) {
      return new Response(
        JSON.stringify({ message: "No stale companies found", archived: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyIds = staleCompanies.map((c) => c.id);

    // Deactivate companies (trigger will auto-deactivate their jobs)
    const { error: updateError } = await supabase
      .from("companies")
      .update({ is_active: false })
      .in("id", companyIds);

    if (updateError) throw updateError;

    console.log(
      `Auto-archived ${companyIds.length} companies: ${staleCompanies.map((c) => c.name).join(", ")}`
    );

    return new Response(
      JSON.stringify({
        message: `Archived ${companyIds.length} companies`,
        archived: companyIds.length,
        companies: staleCompanies.map((c) => c.name),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in auto-archive:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
