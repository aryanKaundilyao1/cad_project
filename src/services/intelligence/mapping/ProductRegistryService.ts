import { supabase } from "@/integrations/supabase/client";

export class ProductRegistryService {
  static async getProducts(): Promise<any[]> {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getProductWithMappings(productId: string): Promise<any> {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_archetype_mapping(id, priority, buyer_archetypes(id, name, industry)),
        product_signal_mapping(id, weight, signal_definitions(id, name, category))
      `)
      .eq('id', productId)
      .single();
    if (error) throw error;
    return product;
  }

  static async createProduct(productData: any): Promise<any> {
    const { data, error } = await supabase.from('products').insert(productData).select().single();
    if (error) throw error;
    return data;
  }

  static async updateProduct(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
}
