import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  BusinessProfile,
  Industry,
  Subcategory,
  TargetAudience,
  TargetGeography,
  IdealLeadType,
  OnboardingFormData,
} from '@/types/intelligence';

/** Fetch all active industries */
export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('industries')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as Industry[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch subcategories for a specific industry */
export function useSubcategories(industryId: string | null) {
  return useQuery({
    queryKey: ['subcategories', industryId],
    queryFn: async () => {
      if (!industryId) return [];
      const { data, error } = await (supabase as any)
        .from('subcategories')
        .select('*')
        .eq('industry_id', industryId)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as Subcategory[];
    },
    enabled: !!industryId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch target audiences */
export function useTargetAudiences() {
  return useQuery({
    queryKey: ['target-audiences'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('target_audiences')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as TargetAudience[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetch target geographies */
export function useTargetGeographies() {
  return useQuery({
    queryKey: ['target-geographies'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('target_geographies')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as TargetGeography[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetch ideal lead types */
export function useIdealLeadTypes() {
  return useQuery({
    queryKey: ['ideal-lead-types'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ideal_lead_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as IdealLeadType[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetch the current user's business profile */
export function useBusinessProfile() {
  const { profile } = useAuth() as any;

  const query = useQuery({
    queryKey: ['business-profile', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await (supabase as any)
        .from('business_profiles')
        .select('*, industries:industry_id(*), subcategories:subcategory_id(*)')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (error) throw error;
      return data as BusinessProfile | null;
    },
    enabled: !!profile?.id,
  });

  return query;
}

/** Save or update business profile during onboarding */
export function useSaveBusinessProfile() {
  const { profile, refreshProfile } = useAuth() as any;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: OnboardingFormData) => {
      if (!profile?.id) throw new Error('Not authenticated');

      const payload = {
        user_id: profile.id,
        company_name: formData.companyName,
        industry_id: formData.industryId || null,
        subcategory_id: formData.subcategoryId || null,
        target_audience: formData.targetAudience,
        target_geography: formData.targetGeography,
        services_products: formData.servicesProducts,
        ideal_lead_types: formData.idealLeadTypes,
        team_size: formData.teamSize,
        monthly_lead_requirement: formData.monthlyLeadRequirement,
        onboarding_data: formData,
      };

      // Upsert business profile
      const { error: bpError } = await (supabase as any)
        .from('business_profiles')
        .upsert(payload, { onConflict: 'user_id' });
      if (bpError) throw bpError;

      // Update profiles table (only columns guaranteed to exist)
      const profileUpdate: Record<string, any> = {
        onboarding_completed: true,
        primary_industry_id: formData.industryId || null,
      };
      if (formData.companyName) {
        profileUpdate.company_name = formData.companyName;
      }

      const { error: profError } = await supabase
        .from('profiles')
        .update(profileUpdate as any)
        .eq('id', profile.id);
      if (profError) throw profError;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      refreshProfile?.();
    },
  });
}
