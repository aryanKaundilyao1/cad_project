import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  company_address: string | null;
  business_type: string | null;
  years_operation: number | null;
  gst_number: string | null;
  pan_number: string | null;
  is_verified: boolean;
  user_type: 'client' | 'company';
  avatar_url: string | null;
  rating: number;
  total_reviews: number;
  subscription_plan?: 'free' | 'basic' | 'premium' | 'elite';
  subscription_expires_at?: string | null;
  billing_cycle?: string | null;
  description: string | null
  portfolio_url: string | null
  monthly_unlocks_used: number | null;
  unlock_cycle_start: string | null;
  is_admin?: boolean;
  business_niche?: string[];
  onboarding_completed?: boolean;
  primary_industry_id?: string | null;
  subscription_type?: 'guest' | 'buyer' | 'seller_free' | 'seller_premium' | 'client_premium' | 'admin';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: {
    full_name?: string;
    user_type: 'client' | 'company';
    phone?: string;
    company_name?: string;
    company_address?: string;
    business_type?: string;
    years_operation?: number;
    gst_number?: string;
    pan_number?: string;
  }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  sendOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string, type?: 'email' | 'signup' | 'recovery') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;              
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: {
      full_name?: string;
      user_type: 'client' | 'company';
      phone?: string;
      company_name?: string;
      company_address?: string;
      business_type?: string;
      years_operation?: number;
      gst_number?: string;
      pan_number?: string;
    }
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: metadata.full_name || metadata.company_name || '',
          user_type: metadata.user_type,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Update profile with additional company info after signup
    // The trigger creates the profile, but we need to wait for it before updating
    if (data.user) {
      const updateData: Record<string, any> = {
        phone: metadata.phone || null,
        subscription_type: metadata.user_type === 'company' ? 'seller_free' : 'buyer'
      };
      if (metadata.user_type === 'company') {
        updateData.company_name = metadata.company_name || null;
        updateData.company_address = metadata.company_address || null;
        updateData.business_type = metadata.business_type || null;
        updateData.years_operation = metadata.years_operation || null;
        updateData.gst_number = metadata.gst_number || null;
        updateData.pan_number = metadata.pan_number || null;
      }

      // Retry logic: wait for the trigger-created profile to exist
      const userId = data.user.id;
      let retries = 0;
      const tryUpdate = async () => {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        if (existing) {
          await supabase.from('profiles').update(updateData).eq('user_id', userId);
        } else if (retries < 5) {
          retries++;
          setTimeout(tryUpdate, 500);
        }
      };
      tryUpdate();
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };
  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string, type: 'email' | 'signup' | 'recovery' = "email") => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signout error:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        sendOtp,
        verifyOtp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};