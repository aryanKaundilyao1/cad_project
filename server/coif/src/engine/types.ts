export type SourceType = 'Google Maps' | 'Apollo' | 'Outscraper' | 'Website' | 'Marketplace' | 'Government' | 'Trade Data' | 'Directory';
export type EvidenceQuality = 'High' | 'Medium' | 'Low';
export type EvidenceTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface Evidence {
  source: SourceType;
  value: string | number | boolean;
  timestamp: string; // ISO date
  tier: EvidenceTier;
}

export interface ObservableMetrics {
  reviewCount?: number;
  reviewRecencyDays?: number;
  hasWebsite?: boolean;
  hasExportPage?: boolean;
  certificates?: string[];
  hasPhone?: boolean;
  hasEmail?: boolean;
  productKeywords?: string[];
  businessCategory?: string;
  country?: string;
  businessDescription?: string;
  oemMention?: boolean;
  privateLabelMention?: boolean;
  wholesaleMention?: boolean;
  revenue?: number;
  employeeCount?: number;
  contactCount?: number;
  [key: string]: any;
}

export interface Lead {
  id: string;
  name: string;
  sources: SourceType[];
  metrics: ObservableMetrics;
  baselineOIEScore: number;
}

export interface ClientContext {
  id: string;
  name: string;
  industry: string;
  targetProducts: string[];
  targetBuyerTypes: string[];
  targetCountries: string[];
  requiredCertifications: string[];
}

export interface ReasonCode {
  category: 'Fit' | 'Intent' | 'Timing' | 'Engagement' | 'Confidence' | 'General';
  description: string;
  impact: number | string; // e.g., '+10', '-5', 'High'
  evidenceSummary?: string;
}

export interface COIFResult {
  leadId: string;
  leadName: string;
  sources: SourceType[];
  baselineOIEScore: number;
  coifScore: number;
  finalScore: number; // Fused score
  confidenceScore: number; // 0 - 100
  confidenceTier: 'High' | 'Medium' | 'Low';
  reasons: ReasonCode[];
  evidenceSummary: string[];
  
  // Breakdowns
  marketFitScore: number;
  businessFitScore: number;
  contactabilityScore: number;
  relationshipPotentialScore: number;
  expansionPotentialScore: number;
  evidenceQualityScore: number;
  riskScore: number;
}
