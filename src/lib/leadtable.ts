import { supabase } from "@/integrations/supabase/client";

async function callLeadtable(endpoint: string) {
  const { data, error } = await supabase.functions.invoke("leadtable", {
    body: { endpoint },
  });
  if (error) throw new Error("Leadtable Fehler: " + error.message);
  return data;
}

export async function getLeadtableKunden() {
  return callLeadtable("/customer/all");
}

export async function getLeadtableKampagnen(customerId: string) {
  return callLeadtable(`/campaign/all/${customerId}`);
}