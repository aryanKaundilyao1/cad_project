import { supabase } from "@/integrations/supabase/client";
import { InternalSignalExtractor } from "./InternalSignalExtractor";
import { SignalService } from "../SignalService";

export class InternalSignalRebuilder {
  
  static async rebuildAll() {
    console.log("Starting full signal rebuild...");
    let totalSignals = 0;

    // 1. Rebuild from Leads
    const { data: leads } = await supabase.from('leads').select('*');
    if (leads) {
      for (const lead of leads) {
        // Ensure company exists
        const companyId = await this.resolveCompany(lead.title || lead.category || 'Unknown Lead Company');
        const signals = await InternalSignalExtractor.processLead(lead);
        await this.storeSignals(companyId, signals);
        totalSignals += signals.length;
      }
    }

    // 2. Rebuild from CRM Leads
    const { data: crmLeads } = await supabase.from('crm_leads').select('*');
    if (crmLeads) {
      for (const crm of crmLeads) {
        const companyId = await this.resolveCompany(crm.company || 'Unknown CRM Company');
        const signals = await InternalSignalExtractor.processCrmActivity(crm);
        await this.storeSignals(companyId, signals);
        totalSignals += signals.length;
      }
    }

    // 3. Rebuild from Projects
    const { data: projects } = await supabase.from('projects').select('*');
    if (projects) {
      for (const proj of projects) {
        const companyId = await this.resolveCompany('Project Owner Entity');
        const signals = await InternalSignalExtractor.processProject(proj);
        await this.storeSignals(companyId, signals);
        totalSignals += signals.length;
      }
    }

    console.log(`Rebuild complete. Generated ${totalSignals} historical signals.`);
    return totalSignals;
  }

  private static async resolveCompany(name: string): Promise<string> {
    const { data } = await supabase.from('companies').select('id').eq('name', name).maybeSingle();
    if (data) return data.id;
    
    const newCompany = await SignalService.createCompany({ name, industry: 'Inferred' });
    return newCompany.id;
  }

  private static async storeSignals(companyId: string, signals: any[]) {
    for (const sig of signals) {
      await SignalService.recordSignalEvent({
        company_id: companyId,
        signal_definition_id: sig.signal_definition_id,
        payload: sig.payload,
        raw_source: sig.raw_source,
        confidence: sig.confidence,
        reliability: sig.reliability
      });
    }
  }
}
