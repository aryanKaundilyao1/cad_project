import { supabase } from "@/integrations/supabase/client";

export interface ImportResult {
  success: number;
  skipped: number;
  errors: number;
  opportunityIds: string[]; // All opp IDs (new + pre-existing) for the given lead IDs
  details: string[];
}

export const crmImportService = {
  /**
   * Idempotent, sequential import of leads into the CRM.
   *
   * Design rules:
   * - Leads are fetched in batches of 50 to avoid URI Too Long (HTTP 400).
   * - Leads are processed ONE AT A TIME (no concurrency) to prevent
   *   race conditions on unique constraints.
   * - Accounts use UPSERT (insert on conflict do update) so parallel or
   *   repeated calls never conflict.
   * - Opportunities use INSERT ON CONFLICT (workspace_id, legacy_lead_id)
   *   DO NOTHING so re-running the pipeline is always safe.
   * - Returns opportunityIds = all opps for the selected leads (new + existing).
   */
  importLeadsToCRM: async (
    leadIds: string[],
    workspaceId: string,
    userId: string
  ): Promise<ImportResult> => {
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      errors: 0,
      opportunityIds: [],
      details: [],
    };

    if (!workspaceId || !userId) {
      throw new Error("workspaceId and userId are required.");
    }

    try {
      // ─── 1. Fetch leads in chunks of 50 (avoids HTTP 400 URI Too Long) ───
      const leads: any[] = [];
      const FETCH_BATCH = 50;
      for (let i = 0; i < leadIds.length; i += FETCH_BATCH) {
        const batch = leadIds.slice(i, i + FETCH_BATCH);
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .in("id", batch);
        if (error) throw error;
        if (data) leads.push(...data);
      }

      if (leads.length === 0) return result;

      // ─── 2. Process each lead SEQUENTIALLY (prevents all race conditions) ───
      for (const lead of leads) {
        try {
          // ── 2a. Check if opportunity already exists ──
          const { data: existingOpp } = await supabase
            .from("opportunities")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("legacy_lead_id", lead.id)
            .maybeSingle();

          if (existingOpp) {
            result.skipped++;
            result.opportunityIds.push(existingOpp.id);
            result.details.push(
              `Skipped: Opportunity for "${lead.company_name || lead.title}" already exists.`
            );
            continue;
          }

          // ── 2b. Find or Create Account (safe — select-then-insert-with-catch) ──
          let accountId: string | null = null;
          const accountName = lead.company_name || "Unknown Company";

          // First try to find existing account for this workspace+name
          const { data: existingAccount } = await supabase
            .from("accounts")
            .select("id")
            .eq("workspace_id", workspaceId)
            .ilike("name", accountName)
            .maybeSingle();

          if (existingAccount) {
            accountId = existingAccount.id;
          } else {
            // Try to insert — if two threads race, the second will get 23505
            const { data: newAccount, error: accError } = await supabase
              .from("accounts")
              .insert({
                workspace_id: workspaceId,
                name: accountName,
                legacy_company_id: lead.company_id || null,
                industry: lead.industry || lead.category || null,
                hq_location: lead.location || null,
                city: lead.city || null,
                country: lead.country || null,
                created_by: userId,
              })
              .select("id")
              .single();

            if (accError) {
              // 23505 = unique_violation — another thread just created it; fetch it
              if (accError.code === "23505") {
                const { data: racedAccount } = await supabase
                  .from("accounts")
                  .select("id")
                  .eq("workspace_id", workspaceId)
                  .ilike("name", accountName)
                  .maybeSingle();
                accountId = racedAccount?.id ?? null;
              } else {
                throw accError;
              }
            } else {
              accountId = newAccount?.id ?? null;
            }
          }

          if (!accountId) throw new Error(`Could not find or create account for "${accountName}".`);

          // ── 2c. Upsert Contact (if contact data available) ──
          const contactEmail =
            lead.email || lead.contact_email || null;
          const contactPhone =
            lead.phone || lead.contact_phone || null;

          if (contactEmail || contactPhone) {
            // Look up by email first, then phone
            let existingContactId: string | null = null;
            if (contactEmail) {
              const { data: found } = await supabase
                .from("contacts")
                .select("id")
                .eq("workspace_id", workspaceId)
                .eq("email", contactEmail)
                .maybeSingle();
              existingContactId = found?.id ?? null;
            } else if (contactPhone) {
              const { data: found } = await supabase
                .from("contacts")
                .select("id")
                .eq("workspace_id", workspaceId)
                .eq("phone", contactPhone)
                .maybeSingle();
              existingContactId = found?.id ?? null;
            }

            if (!existingContactId) {
              const firstName =
                lead.first_name ||
                lead.contact_name?.split(" ")[0] ||
                "Unknown";
              const lastName =
                lead.last_name ||
                lead.contact_name?.split(" ").slice(1).join(" ") ||
                "";
              const fullName =
                lead.contact_name || `${firstName} ${lastName}`.trim();

              await supabase.from("contacts").insert({
                workspace_id: workspaceId,
                account_id: accountId,
                first_name: firstName,
                last_name: lastName,
                full_name: fullName,
                email: contactEmail,
                phone: contactPhone,
                created_by: userId,
              });
              // Ignore contact insert errors — contact is supplemental data
            }
          }

          // ── 2d. Insert Opportunity (ON CONFLICT DO NOTHING — fully idempotent) ──
          const oppTitle = `${accountName} - ${lead.industry || lead.category || "Opportunity"} Expansion`;

          // Use raw SQL via RPC approach: insert and handle conflict gracefully
          const { data: newOpp, error: oppError } = await supabase
            .from("opportunities")
            .insert({
              workspace_id: workspaceId,
              account_id: accountId,
              legacy_lead_id: lead.id,
              title: oppTitle,
              description: lead.description || null,
              industry: lead.industry || lead.category || null,
              estimated_value: lead.budget_max || lead.budget_min || 0,
              source: "Lead Database Import",
              stage: "discovery", // RPC expects 'discovery' to run scoring
              assigned_to: userId,
              created_by: userId,
            })
            .select("id")
            .single();

          // 23505 = unique_violation — opportunity already exists (race guard)
          if (oppError) {
            if (oppError.code === "23505") {
              // Fetch the existing opp and count as skipped
              const { data: raceOpp } = await supabase
                .from("opportunities")
                .select("id")
                .eq("workspace_id", workspaceId)
                .eq("legacy_lead_id", lead.id)
                .maybeSingle();
              if (raceOpp) {
                result.skipped++;
                result.opportunityIds.push(raceOpp.id);
              }
              continue;
            }
            throw oppError;
          }

          if (!newOpp) throw new Error("Failed to create opportunity.");

          result.opportunityIds.push(newOpp.id);

          // ── 2e. Log system activity (non-critical, ignore failures) ──
          await supabase
            .from("activities")
            .insert({
              workspace_id: workspaceId,
              opportunity_id: newOpp.id,
              account_id: accountId,
              activity_type: "system",
              title: "Lead Imported to Pipeline",
              description: `"${lead.title || accountName}" was imported from the Lead Database and entered the intelligence pipeline.`,
              created_by: userId,
            })
            .then(() => {})
            .catch(() => {}); // non-critical

          result.success++;
        } catch (itemError: any) {
          console.error(`Import failed for lead ${lead.id}:`, itemError);
          result.errors++;
          result.details.push(
            `Error: "${lead.company_name || lead.title || lead.id}" — ${itemError.message}`
          );
        }
      }

      // ─── 3. Also collect any pre-existing opps for leads we missed ───
      // (handles the case where some leads were already in the pipeline before this run)
      if (result.opportunityIds.length < leadIds.length) {
        const alreadyTracked = new Set(result.opportunityIds);
        for (let i = 0; i < leadIds.length; i += FETCH_BATCH) {
          const batch = leadIds.slice(i, i + FETCH_BATCH);
          const { data: existingOpps } = await supabase
            .from("opportunities")
            .select("id, legacy_lead_id")
            .eq("workspace_id", workspaceId)
            .in("legacy_lead_id", batch);

          if (existingOpps) {
            for (const opp of existingOpps) {
              if (!alreadyTracked.has(opp.id)) {
                result.opportunityIds.push(opp.id);
                alreadyTracked.add(opp.id);
              }
            }
          }
        }
      }

      return result;
    } catch (globalError: any) {
      console.error("Fatal import error:", globalError);
      throw globalError;
    }
  },
};
