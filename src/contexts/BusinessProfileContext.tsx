import { createContext, useContext, ReactNode } from 'react';
import { useBusinessProfile, useIndustries } from '@/hooks/useBusinessProfile';
import { useAuth } from '@/contexts/AuthContext';
import type { BusinessProfile, Industry } from '@/types/intelligence';

interface BusinessProfileContextType {
  businessProfile: BusinessProfile | null | undefined;
  industries: Industry[];
  isLoading: boolean;
  needsOnboarding: boolean;
  industryName: string | null;
  crmLabel: string;
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

export const BusinessProfileProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth() as any;
  const { data: businessProfile, isLoading: bpLoading } = useBusinessProfile();
  const { data: industries, isLoading: indLoading } = useIndustries();

  const isLoading = bpLoading || indLoading;

  const needsOnboarding = !!profile && !profile.onboarding_completed && !isLoading;

  const industryName = businessProfile?.industry_id
    ? (industries || []).find(i => i.id === businessProfile.industry_id)?.name || null
    : null;

  const crmLabel = industryName ? `${industryName} CRM` : 'CRM Pipeline';

  return (
    <BusinessProfileContext.Provider
      value={{
        businessProfile: businessProfile,
        industries: industries || [],
        isLoading,
        needsOnboarding,
        industryName,
        crmLabel,
      }}
    >
      {children}
    </BusinessProfileContext.Provider>
  );
};

export const useBusinessProfileContext = () => {
  const context = useContext(BusinessProfileContext);
  if (context === undefined) {
    throw new Error('useBusinessProfileContext must be used within a BusinessProfileProvider');
  }
  return context;
};
