import { supabase } from "@/integrations/supabase/client";
import { ProductRegistryService } from "../mapping/ProductRegistryService";

export interface ProductIntelligenceData {
  product: any;
  mappedArchetypes: any[];
  mappedSignals: any[];
  eligibleCompanies: any[];
}

export class ProductIntelligenceService {
  
  /**
   * Aggregates the intelligence profile for a specific product.
   * This includes the base product, mapped buyer archetypes, mapped signal weights,
   * and the actual companies that have been deemed eligible.
   */
  static async getProductIntelligence(productId: string): Promise<ProductIntelligenceData> {
    
    // 1. Get Product with basic mappings
    const productData = await ProductRegistryService.getProductWithMappings(productId);
    if (!productData) throw new Error("Product not found");

    // 2. Fetch Companies eligible for this product
    // company_product_matches tells us which companies qualify
    const { data: eligibleCompaniesData, error: compErr } = await supabase
      .from('company_product_matches')
      .select(`
        company_id,
        reason_codes,
        companies(id, name, industry, domain)
      `)
      .eq('product_id', productId);

    if (compErr) throw compErr;

    // We can also fetch the actual signal timeline events for these companies, 
    // filtered ONLY by the signals mapped to this product.
    const mappedSignalIds = productData.product_signal_mapping.map((m: any) => m.signal_definitions?.id).filter(Boolean);
    const companyIds = eligibleCompaniesData?.map(c => c.company_id) || [];

    let relevantSignals = [];
    if (mappedSignalIds.length > 0 && companyIds.length > 0) {
       const { data: signalEvents, error: sigErr } = await supabase
        .from('signal_event_store')
        .select(`
          id, company_id, signal_definition_id, occurred_at, payload, raw_source,
          signal_definitions(name, category),
          companies(name)
        `)
        .in('company_id', companyIds)
        .in('signal_definition_id', mappedSignalIds)
        .order('occurred_at', { ascending: false })
        .limit(100); // For UI sanity
        
        if (!sigErr && signalEvents) {
          relevantSignals = signalEvents;
        }
    }

    return {
      product: productData,
      mappedArchetypes: productData.product_archetype_mapping || [],
      mappedSignals: productData.product_signal_mapping || [],
      // Attach the matched signals to the eligible companies view
      eligibleCompanies: eligibleCompaniesData?.map(ec => {
        return {
          ...ec,
          relevantEvents: relevantSignals.filter((rs: any) => rs.company_id === ec.company_id)
        };
      }) || []
    };
  }
}
