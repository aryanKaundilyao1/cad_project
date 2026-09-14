import { supabase } from "@/integrations/supabase/client";

export class CommunicationTemplateService {
  /**
   * Manages the versioning and retrieval of prompt templates.
   */
  static async getTemplate(templateType: string) {
    const { data: template } = await supabase.from('communication_templates')
      .select('*')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .single();
    
    return template;
  }
}
