// Master Schema for Research Modules
// This schema strictly defines the JSONB structure stored in lead_modules.evidence.
// It also serves as the configuration for dynamic UI form generation in the Admin Panel.

export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'array' | 'enum';

export interface ModuleField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  scoringPillar?: string; // Links to scoring engine
  validation?: string; // Hint for UI validators
  options?: string[]; // Used if type is 'enum'
  description?: string;
}

export interface ModuleSchema {
  id: string;
  name: string;
  description: string;
  fields: ModuleField[];
  isArrayConfig?: boolean; // For flexible/repeatable structures like certifications
}

export const ModuleSchemas: Record<string, ModuleSchema> = {
  website: {
    id: 'Website Intelligence',
    name: 'Website Intelligence',
    description: 'Digital presence, structure, and maturity evaluation',
    fields: [
      { id: 'website_url', label: 'Website URL', type: 'text', required: true },
      { id: 'website_status', label: 'Website Status', type: 'enum', required: false, options: ['Active', 'Inactive', 'Under Construction'] },
      { id: 'website_https', label: 'HTTPS Secured', type: 'boolean', required: false, scoringPillar: 'Trust Score' },
      { id: 'website_domain', label: 'Domain Root', type: 'text', required: false },
      { id: 'website_domain_age', label: 'Domain Age (Years)', type: 'number', required: false, scoringPillar: 'Trust Score' },
      { id: 'website_language', label: 'Primary Language', type: 'text', required: false },
      { id: 'website_title', label: 'Page Title', type: 'text', required: false },
      { id: 'website_description', label: 'Meta Description', type: 'text', required: false },
      { id: 'website_about_page', label: 'Has About Page', type: 'boolean', required: false },
      { id: 'website_products_page', label: 'Has Products Page', type: 'boolean', required: false, scoringPillar: 'Fit Score' },
      { id: 'website_catalog_page', label: 'Has Digital Catalog', type: 'boolean', required: false },
      { id: 'website_export_page', label: 'Has Export/Global Page', type: 'boolean', required: false, scoringPillar: 'Intent Score' },
      { id: 'website_certification_page', label: 'Has Certifications Page', type: 'boolean', required: false, scoringPillar: 'Trust Score' },
      { id: 'website_contact_page', label: 'Has Contact Page', type: 'boolean', required: false },
      { id: 'website_whatsapp', label: 'WhatsApp Number', type: 'text', required: false, scoringPillar: 'Contactability Score' },
      { id: 'website_email', label: 'Support/Sales Email', type: 'text', required: false, scoringPillar: 'Contactability Score', validation: 'email' },
      { id: 'website_phone', label: 'Direct Phone', type: 'text', required: false, scoringPillar: 'Contactability Score' },
      { id: 'website_social_links', label: 'Social Links', type: 'array', required: false },
      { id: 'website_blog', label: 'Active Blog', type: 'boolean', required: false },
      { id: 'website_last_updated', label: 'Last Content Update', type: 'date', required: false },
      { id: 'website_quality_score', label: 'Website Quality Score (1-100)', type: 'number', required: false, scoringPillar: 'Trust Score' },
      { id: 'website_notes', label: 'Research Notes', type: 'text', required: false }
    ]
  },
  linkedin: {
    id: 'LinkedIn Intelligence',
    name: 'LinkedIn Intelligence',
    description: 'Social proof, employee metrics, and growth signals',
    fields: [
      { id: 'linkedin_company_url', label: 'Company LinkedIn URL', type: 'text', required: true, validation: 'url' },
      { id: 'linkedin_company_id', label: 'LinkedIn Company ID', type: 'text', required: false },
      { id: 'linkedin_followers', label: 'Follower Count', type: 'number', required: false, scoringPillar: 'Reputation Score' },
      { id: 'linkedin_employee_count', label: 'Employee Count (Reported)', type: 'number', required: false, scoringPillar: 'Fit Score' },
      { id: 'linkedin_growth', label: 'Headcount Growth (%)', type: 'number', required: false },
      { id: 'linkedin_industry', label: 'Stated Industry', type: 'text', required: false, scoringPillar: 'Fit Score' },
      { id: 'linkedin_headquarters', label: 'Headquarters Location', type: 'text', required: false },
      { id: 'linkedin_locations', label: 'Number of Locations', type: 'number', required: false },
      { id: 'linkedin_company_size', label: 'Company Size Bracket', type: 'enum', required: false, options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
      { id: 'linkedin_founded', label: 'Year Founded', type: 'number', required: false, scoringPillar: 'Trust Score' },
      { id: 'linkedin_ceo_name', label: 'CEO/Founder Name', type: 'text', required: false },
      { id: 'linkedin_procurement_head', label: 'Head of Procurement', type: 'text', required: false },
      { id: 'linkedin_recent_posts', label: 'Recent Posts (Last 30d)', type: 'number', required: false },
      { id: 'linkedin_hiring', label: 'Actively Hiring', type: 'boolean', required: false, scoringPillar: 'Intent Score' },
      { id: 'linkedin_last_activity', label: 'Last Activity Date', type: 'date', required: false },
      { id: 'linkedin_engagement_score', label: 'Engagement Score (1-100)', type: 'number', required: false, scoringPillar: 'Reputation Score' },
      { id: 'linkedin_notes', label: 'Research Notes', type: 'text', required: false }
    ]
  },
  import_export: {
    id: 'Import/Export Intelligence',
    name: 'Import/Export Intelligence',
    description: 'Historical trade frequency and procurement volume',
    fields: [
      { id: 'shipment_count', label: 'Total Shipments', type: 'number', required: true, scoringPillar: 'Intent Score' },
      { id: 'last_shipment_date', label: 'Last Shipment Date', type: 'date', required: false, scoringPillar: 'Intent Score' },
      { id: 'first_shipment_date', label: 'First Shipment Date', type: 'date', required: false },
      { id: 'import_frequency', label: 'Import Frequency', type: 'enum', required: false, scoringPillar: 'Intent Score', options: ['High', 'Medium', 'Low', 'None'] },
      { id: 'export_frequency', label: 'Export Frequency', type: 'enum', required: false, options: ['High', 'Medium', 'Low', 'None'] },
      { id: 'origin_country', label: 'Primary Origin Country', type: 'text', required: false },
      { id: 'destination_country', label: 'Primary Destination Country', type: 'text', required: false },
      { id: 'supplier_count', label: 'Known Supplier Count', type: 'number', required: false },
      { id: 'buyer_count', label: 'Known Buyer Count', type: 'number', required: false },
      { id: 'major_products', label: 'Major Products Traded', type: 'array', required: false, scoringPillar: 'Fit Score' },
      { id: 'major_suppliers', label: 'Major Suppliers', type: 'array', required: false },
      { id: 'major_buyers', label: 'Major Buyers', type: 'array', required: false },
      { id: 'hs_codes', label: 'HS Codes Used', type: 'array', required: false, scoringPillar: 'Fit Score' },
      { id: 'ports', label: 'Ports Utilized', type: 'array', required: false },
      { id: 'shipping_lines', label: 'Shipping Lines Used', type: 'array', required: false },
      { id: 'trade_score', label: 'Trade Reliability Score (1-100)', type: 'number', required: false, scoringPillar: 'Trust Score' },
      { id: 'import_export_notes', label: 'Research Notes', type: 'text', required: false }
    ]
  },
  marketplace: {
    id: 'Marketplace Intelligence',
    name: 'Marketplace Intelligence',
    description: 'Active intent and behavior on B2B marketplaces',
    fields: [
      { id: 'marketplace_name', label: 'Marketplace Name (e.g. Alibaba)', type: 'text', required: true },
      { id: 'marketplace_profile', label: 'Profile URL', type: 'text', required: false, validation: 'url' },
      { id: 'marketplace_verified', label: 'Verified Supplier/Buyer', type: 'boolean', required: false, scoringPillar: 'Trust Score' },
      { id: 'rfq_count', label: 'Active RFQ Count', type: 'number', required: false, scoringPillar: 'Intent Score' },
      { id: 'buying_requests', label: 'Total Buying Requests', type: 'number', required: false, scoringPillar: 'Intent Score' },
      { id: 'selling_products', label: 'Total Products Listed', type: 'number', required: false },
      { id: 'response_rate', label: 'Response Rate (%)', type: 'number', required: false, scoringPillar: 'Contactability Score' },
      { id: 'active_status', label: 'Profile Status', type: 'enum', required: false, options: ['Active', 'Dormant', 'Suspended'] },
      { id: 'marketplace_score', label: 'Marketplace Score/Rating (1-100)', type: 'number', required: false, scoringPillar: 'Reputation Score' },
      { id: 'marketplace_notes', label: 'Research Notes', type: 'text', required: false }
    ]
  },
  decision_maker: {
    id: 'Decision Maker',
    name: 'Decision Maker',
    description: 'Key contact mapping for outreach',
    fields: [
      { id: 'decision_maker_name', label: 'Full Name', type: 'text', required: true },
      { id: 'decision_maker_designation', label: 'Designation / Title', type: 'text', required: false, scoringPillar: 'Contactability Score' },
      { id: 'decision_maker_department', label: 'Department', type: 'text', required: false },
      { id: 'decision_maker_email', label: 'Direct Email', type: 'text', required: false, scoringPillar: 'Contactability Score', validation: 'email' },
      { id: 'decision_maker_phone', label: 'Direct Phone', type: 'text', required: false, scoringPillar: 'Contactability Score' },
      { id: 'decision_maker_linkedin', label: 'LinkedIn Profile', type: 'text', required: false, validation: 'url' },
      { id: 'decision_maker_verified', label: 'Identity Verified', type: 'boolean', required: false, scoringPillar: 'Trust Score' },
      { id: 'email_verified', label: 'Email Verified (Pinged)', type: 'boolean', required: false, scoringPillar: 'Contactability Score' },
      { id: 'phone_verified', label: 'Phone Verified (Called)', type: 'boolean', required: false, scoringPillar: 'Contactability Score' },
      { id: 'contact_priority', label: 'Contact Priority', type: 'enum', required: false, options: ['High', 'Medium', 'Low'] },
      { id: 'decision_notes', label: 'Outreach Notes', type: 'text', required: false }
    ]
  },
  certifications: {
    id: 'Certifications',
    name: 'Certifications & Compliance',
    description: 'Flexible container for ISO, GMP, FDA, Organic, etc.',
    isArrayConfig: true,
    fields: [
      { id: 'certification_name', label: 'Certification Name', type: 'text', required: true, scoringPillar: 'Fit Score' },
      { id: 'issuing_body', label: 'Issuing Body', type: 'text', required: false },
      { id: 'certificate_number', label: 'Certificate Number', type: 'text', required: false },
      { id: 'issue_date', label: 'Issue Date', type: 'date', required: false },
      { id: 'expiry_date', label: 'Expiry Date', type: 'date', required: false },
      { id: 'verification_status', label: 'Verification Status', type: 'enum', required: false, scoringPillar: 'Trust Score', options: ['Verified', 'Pending', 'Expired', 'Invalid'] },
      { id: 'industry', label: 'Relevant Industry', type: 'text', required: false },
      { id: 'notes', label: 'Notes', type: 'text', required: false }
    ]
  }
};
