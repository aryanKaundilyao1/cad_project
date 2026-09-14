import { supabase } from '@/integrations/supabase/client';

export type SignalType = 
  | 'Tender Published' 
  | 'Factory Expansion' 
  | 'Project Approval'
  | 'Vendor Registration'
  | 'Contract Award';

export interface OpportunityGenerationRule {
  id: string;
  signal_type: string;
  min_confidence: number;
  is_active: boolean;
}

export interface OpportunityCandidate {
  id: string;
  company_id: string;
  signal_id: string;
  signal_type: string;
  confidence: number;
  status: 'Candidate' | 'Qualified' | 'Converted' | 'Rejected' | 'Archived';
  generated_at: string;
  converted_opportunity_id?: string;
}

export class OpportunityGenerationEngine {
  /**
   * Process an incoming signal to determine if it should create an Opportunity Candidate
   */
  static async processSignal(signalId: string): Promise<{ created: boolean; candidateId?: string; reason?: string }> {
    try {
      // 1. Fetch the signal details
      const { data: signal, error: signalError } = await supabase
        .from('signals')
        .select('*, companies:company_signals(company_id)')
        .eq('id', signalId)
        .single();

      if (signalError || !signal) throw new Error('Signal not found');

      const companyId = signal.companies?.[0]?.company_id;
      if (!companyId) return { created: false, reason: 'No associated company found for signal.' };

      // 2. Fetch Active Generation Rules
      const { data: rules, error: rulesError } = await supabase
        .from('opportunity_generation_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError || !rules) throw rulesError;

      // 3. Evaluate Rule
      const matchedRule = rules.find(
        (r) => r.signal_type.toLowerCase() === signal.signal_type.toLowerCase() && signal.confidence_score >= r.min_confidence
      );

      if (!matchedRule) {
        return { created: false, reason: 'Signal did not meet any generation rules or confidence thresholds.' };
      }

      // 4. Duplicate / Merging Strategy Check
      // Check if an active opportunity already exists for this company
      const { data: activeOpps, error: oppsError } = await supabase
        .from('opportunities')
        .select('id, status')
        .eq('company_id', companyId)
        .in('status', ['open']);

      if (!oppsError && activeOpps && activeOpps.length > 0) {
        // An active opportunity exists. We merge (silently skip generating a new candidate).
        // The UI will naturally show this new signal on the Opportunity workspace timeline via company_id mapping.
        return { created: false, reason: 'Merged: Company already has an active Opportunity.' };
      }

      // Check if candidate already exists to prevent duplicate generation
      const { data: existingCandidate } = await supabase
        .from('opportunity_candidates')
        .select('id')
        .eq('company_id', companyId)
        .eq('signal_id', signalId)
        .single();

      if (existingCandidate) {
        return { created: false, reason: 'Candidate already exists for this exact signal.' };
      }

      // 5. Generate Candidate
      const { data: newCandidate, error: candidateError } = await supabase
        .from('opportunity_candidates')
        .insert({
          company_id: companyId,
          signal_id: signalId,
          signal_type: signal.signal_type,
          confidence: signal.confidence_score,
          status: 'Candidate',
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      return { created: true, candidateId: newCandidate.id };
    } catch (error) {
      console.error('Error generating opportunity candidate:', error);
      return { created: false, reason: 'Internal error during generation.' };
    }
  }

  /**
   * Convert a candidate into a live Opportunity in the pipeline
   */
  static async convertCandidate(
    candidateId: string, 
    workspaceId: string, 
    ownerId: string,
    title: string,
    estimatedValue?: number
  ): Promise<{ success: boolean; opportunityId?: string; error?: any }> {
    try {
      const { data: candidate, error: candidateError } = await supabase
        .from('opportunity_candidates')
        .select('*, company:jas_companies(company_name, industry)')
        .eq('id', candidateId)
        .single();

      if (candidateError || !candidate) throw new Error('Candidate not found');

      // 1. Create the Opportunity Record
      const { data: newOpp, error: oppError } = await supabase
        .from('opportunities')
        .insert({
          workspace_id: workspaceId,
          account_id: candidate.company_id, // Map company to account
          company_id: candidate.company_id,
          candidate_origin_id: candidate.id,
          title: title || `${candidate.signal_type} - ${candidate.company?.company_name || 'Opportunity'}`,
          industry: candidate.company?.industry,
          source: 'Intelligence Signal',
          stage: 'Discovery',
          estimated_value: estimatedValue || 0,
          assigned_to: ownerId,
          created_by: ownerId,
        })
        .select()
        .single();

      if (oppError) throw oppError;

      // 2. Create the Pipeline Item linking the Opp
      const { error: pipelineError } = await supabase
        .from('pipeline_items')
        .insert({
          workspace_id: workspaceId,
          opportunity_id: newOpp.id,
          account_id: candidate.company_id,
          owner_id: ownerId,
          industry: candidate.company?.industry,
          stage: 'Discovery',
        });

      if (pipelineError) throw pipelineError;

      // 3. Mark Candidate as Converted
      await supabase
        .from('opportunity_candidates')
        .update({ 
          status: 'Converted', 
          converted_opportunity_id: newOpp.id 
        })
        .eq('id', candidateId);

      return { success: true, opportunityId: newOpp.id };
    } catch (error) {
      console.error('Error converting candidate to opportunity:', error);
      return { success: false, error };
    }
  }
}
