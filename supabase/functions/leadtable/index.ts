import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const API_KEY = Deno.env.get("LEADTABLE_API_KEY");
  const EMAIL = Deno.env.get("LEADTABLE_EMAIL");
  const BASE = "https://api.lead-table.com/api/v3/external";

  const headers = {
    "x-api-key": API_KEY!,
    "email": EMAIL!,
    "Content-Type": "application/json",
  };

  const { endpoint } = await req.json();

  const res = await fetch(`${BASE}${endpoint}`, { headers });
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: res.status,
  });
});