import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns unread message counts per application for the employer's company.
 * Only counts messages sent by applicants (sender_type = 'applicant') that are unread.
 */
export const useUnreadMessages = (companyId: string | null) => {
  return useQuery({
    queryKey: ["employer-unread-messages", companyId],
    queryFn: async () => {
      if (!companyId) return { total: 0, byApplication: {} as Record<string, number> };

      // Get all application IDs for this company
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_archived", false);

      if (appsError || !apps || apps.length === 0) {
        // Also try via jobs
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id")
          .eq("company_id", companyId);

        if (!jobs || jobs.length === 0) return { total: 0, byApplication: {} as Record<string, number> };

        const { data: jobApps } = await supabase
          .from("applications")
          .select("id")
          .in("job_id", jobs.map(j => j.id))
          .eq("is_archived", false);

        if (!jobApps || jobApps.length === 0) return { total: 0, byApplication: {} as Record<string, number> };

        const appIds = jobApps.map(a => a.id);
        return fetchUnreadForApps(appIds);
      }

      // Also get apps via jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("company_id", companyId);

      let allAppIds = apps.map(a => a.id);

      if (jobs && jobs.length > 0) {
        const { data: jobApps } = await supabase
          .from("applications")
          .select("id")
          .in("job_id", jobs.map(j => j.id))
          .eq("is_archived", false);

        if (jobApps) {
          const extraIds = jobApps.map(a => a.id).filter(id => !allAppIds.includes(id));
          allAppIds = [...allAppIds, ...extraIds];
        }
      }

      return fetchUnreadForApps(allAppIds);
    },
    enabled: !!companyId,
    refetchInterval: 30000, // refresh every 30s
  });
};

async function fetchUnreadForApps(appIds: string[]) {
  const byApplication: Record<string, number> = {};
  let total = 0;

  // Fetch unread messages from applicants in batches
  const batchSize = 50;
  for (let i = 0; i < appIds.length; i += batchSize) {
    const batch = appIds.slice(i, i + batchSize);
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, application_id")
      .in("application_id", batch)
      .eq("sender_type", "applicant")
      .eq("is_read", false);

    if (msgs) {
      for (const msg of msgs) {
        byApplication[msg.application_id] = (byApplication[msg.application_id] || 0) + 1;
        total++;
      }
    }
  }

  return { total, byApplication };
}
