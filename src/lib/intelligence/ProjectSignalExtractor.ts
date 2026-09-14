import { BaseSignalExtractor, Signal } from "./BaseSignalExtractor";

export interface ProjectRecord {
  id: string;
  project_name?: string;
  project_type?: string;
  project_stage?: string;
  developer?: string;
  estimated_value?: number;
  raw_description?: string;
  expected_completion_date?: string | Date;
}

export class ProjectSignalExtractor extends BaseSignalExtractor<ProjectRecord> {
  constructor() {
    // 85% base confidence for typical scraped projects, 30 days duplicate window
    super("Industrial Projects", 85, 30); 
  }

  async extract(project: ProjectRecord): Promise<Signal[]> {
    const signals: Signal[] = [];
    const nameLower = (project.project_name || '').toLowerCase();
    const typeLower = (project.project_type || '').toLowerCase();
    const stageLower = (project.project_stage || '').toLowerCase();
    const descLower = (project.raw_description || '').toLowerCase();

    const combinedText = `${nameLower} ${typeLower} ${descLower}`;

    // 1. Factory Expansion (High)
    if (
      nameLower.includes('expansion') || 
      nameLower.includes('new unit') || 
      combinedText.includes('manufacturing facility') ||
      combinedText.includes('plant expansion')
    ) {
      signals.push({
        signal_type: 'Factory Expansion',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(90),
        signal_strength: 'High',
        status: 'Active',
        project_id: project.id,
        expires_at: project.expected_completion_date ? new Date(project.expected_completion_date) : undefined
      });
    }

    // 2. Warehouse Development (High)
    if (
      typeLower.includes('logistics') || 
      nameLower.includes('warehouse') || 
      combinedText.includes('logistics park')
    ) {
      signals.push({
        signal_type: 'Warehouse Development',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(95),
        signal_strength: 'High',
        status: 'Active',
        project_id: project.id,
        expires_at: project.expected_completion_date ? new Date(project.expected_completion_date) : undefined
      });
    }
    
    // 3. Industrial Expansion (High)
    if (
      typeLower.includes('industrial') && 
      !nameLower.includes('expansion') && // avoid overlap with Factory Expansion if possible
      !combinedText.includes('manufacturing facility')
    ) {
      signals.push({
        signal_type: 'Industrial Expansion',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(80),
        signal_strength: 'High',
        status: 'Active',
        project_id: project.id,
        expires_at: project.expected_completion_date ? new Date(project.expected_completion_date) : undefined
      });
    }

    // 4. Construction Activity (Medium)
    if (
      stageLower.includes('under construction') || 
      stageLower.includes('construction') ||
      combinedText.includes('civil work started')
    ) {
      signals.push({
        signal_type: 'Construction Activity',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(90),
        signal_strength: 'Medium',
        status: 'Active',
        project_id: project.id,
        expires_at: project.expected_completion_date ? new Date(project.expected_completion_date) : undefined
      });
    }

    // 5. Project Approval (Medium)
    if (
      stageLower === 'approved' || 
      stageLower === 'cleared' ||
      combinedText.includes('received approval') ||
      combinedText.includes('environmental clearance')
    ) {
      signals.push({
        signal_type: 'Project Approval',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(100), // High confidence if stage is exactly approved
        signal_strength: 'Medium',
        status: 'Active',
        project_id: project.id
      });
    }

    // 6. Funding Secured (Medium)
    if (
      combinedText.includes('funding secured') || 
      combinedText.includes('financial closure') ||
      combinedText.includes('investment of')
    ) {
      signals.push({
        signal_type: 'Funding Secured',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(85),
        signal_strength: 'Medium',
        status: 'Active',
        project_id: project.id
      });
    }

    // 7. Vendor Selection (High)
    if (
      stageLower.includes('bidding') || 
      stageLower.includes('contractor appointed') ||
      combinedText.includes('tender floated') ||
      combinedText.includes('epc contract awarded')
    ) {
      signals.push({
        signal_type: 'Vendor Selection',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(90),
        signal_strength: 'High',
        status: 'Active',
        project_id: project.id
      });
    }

    // 8. Infrastructure Development (High)
    if (
      typeLower.includes('infrastructure') || 
      nameLower.includes('highway') ||
      nameLower.includes('airport') ||
      nameLower.includes('port')
    ) {
      signals.push({
        signal_type: 'Infrastructure Development',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(95),
        signal_strength: 'High',
        status: 'Active',
        project_id: project.id,
        expires_at: project.expected_completion_date ? new Date(project.expected_completion_date) : undefined
      });
    }

    return signals;
  }
}
