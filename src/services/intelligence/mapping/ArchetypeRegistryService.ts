import { supabase } from "@/integrations/supabase/client";

export class ArchetypeRegistryService {
  static async getArchetypes(): Promise<any[]> {
    const { data, error } = await supabase.from('buyer_archetypes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getArchetypeWithMappings(archetypeId: string): Promise<any> {
    const { data: archetype, error } = await supabase
      .from('buyer_archetypes')
      .select(`
        *,
        product_archetype_mapping(id, priority, products(id, name))
      `)
      .eq('id', archetypeId)
      .single();
    if (error) throw error;
    return archetype;
  }

  static async createArchetype(archetypeData: any): Promise<any> {
    const { data, error } = await supabase.from('buyer_archetypes').insert(archetypeData).select().single();
    if (error) throw error;
    return data;
  }
}
