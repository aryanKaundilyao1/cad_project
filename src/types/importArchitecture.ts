export interface Industry {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'industry' | 'niche' | 'sub_niche';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  name: string;
  description: string | null;
  default_fields: any[]; // Or define more strongly
  supported_file_types: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface TemplateField {
  name: string;
  key: string;
  type: string;
  required: boolean;
  field_category?: 'company' | 'project' | 'custom';
  defaultValue?: string;
  options?: string;
}

export interface ImportTemplate {
  id: string;
  industry_id: string;
  niche_id: string | null;
  sub_niche_id: string | null;
  source_id: string;
  
  template_name: string;
  description: string | null;
  
  fields_json: TemplateField[];
  
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  industry_id: string | null;
  source_id: string | null;
  template_id: string | null;
  
  file_name: string;
  file_type: string;
  
  row_count: number;
  success_count: number;
  failed_count: number;
  
  status: 'processing' | 'completed' | 'failed';
  
  uploaded_by: string | null;
  
  created_at: string;
}

export interface UploadRow {
  id: string;
  upload_id: string;
  raw_data: Record<string, any>;
  validation_status: 'valid' | 'invalid';
  validation_errors: string[];
  created_at: string;
}

// ==========================================
// STAGE 2: Normalization Engine
// ==========================================

export interface FieldDictionary {
  id: string;
  normalized_name: string;
  field_category: 'company' | 'project' | 'custom';
  aliases: string[];
  created_at: string;
  updated_at: string;
}

export interface NormalizedCompany {
  id: string;
  company_name: string;
  industry?: string;
  niche?: string;
  sub_niche?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NormalizedProject {
  id: string;
  company_id: string;
  project_name: string;
  industry?: string;
  project_type?: string;
  budget?: string;
  project_size?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyAttribute {
  id: string;
  company_id: string;
  attribute_name: string;
  attribute_value: string;
  source?: string;
  created_at?: string;
}

export interface NormalizationLog {
  id: string;
  upload_id: string;
  original_field: string;
  mapped_field: string;
  status: 'mapped' | 'unmapped' | 'error';
  created_at?: string;
}
