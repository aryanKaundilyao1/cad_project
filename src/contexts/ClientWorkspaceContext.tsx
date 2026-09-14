import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  activeClient: any | null;
  availableClients: any[];
  membership: any | null;
  role: string | null;
  company: any | null; // Kept for backwards compatibility if needed
  categories: any[];
  products: any[];
  activeProduct: any | null;
  setActiveProduct: (product: any) => void;
  loading: boolean;
  error: string | null;
  setActiveClient: (client: any) => void;
  refreshWorkspace: () => void;
}

const ClientWorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const ClientWorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [activeClient, setActiveClientState] = useState<any | null>(null);
  const [membership, setMembership] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(null);
  
  // Legacy aliases
  const [company, setCompany] = useState<any | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWorkspaceData();
    } else {
      setLoading(false);
      resetState();
    }
  }, [user]);

  const resetState = () => {
    setAvailableClients([]);
    setActiveClientState(null);
    setMembership(null);
    setRole(null);
    setCompany(null);
    setProducts([]);
    setActiveProduct(null);
    setCategories([]);
    setError(null);
  }

  const setActiveClient = (client: any) => {
    setActiveClientState(client);
    setCompany(client);
    // Future: reload client specific products/categories here based on client.id
  };

  const fetchWorkspaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Query memberships
      const { data: members, error: memError } = await supabase
        .from('jas_client_members')
        .select(`
          role,
          is_primary_client,
          client_id,
          jas_clients (*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'ACTIVE');

      if (memError) throw memError;

      if (!members || members.length === 0) {
        setError("No workspace has been assigned to this account.");
        setLoading(false);
        return;
      }

      // Format clients
      const clients = members.map(m => m.jas_clients).filter(Boolean);
      setAvailableClients(clients);

      // Select active client
      // Prefer the one marked primary, or fallback to the first one
      const primaryMember = members.find(m => m.is_primary_client) || members[0];
      const selectedClient = primaryMember.jas_clients;
      
      setMembership(primaryMember);
      setRole(primaryMember.role);
      setActiveClient(selectedClient);

      // Once active client is set, query real products/categories scoped to client_id
      const { data: prods, error: prodError } = await supabase
        .from('joep_products')
        .select('*')
        .eq('client_id', selectedClient.id);
        
      if (!prodError && prods) {
        setProducts(prods);
        if (prods.length > 0) setActiveProduct(prods[0]);
      } else {
        setProducts([]);
      }

    } catch (err: any) {
      console.error("Error loading workspace:", err);
      setError("Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientWorkspaceContext.Provider value={{
      activeClient,
      availableClients,
      membership,
      role,
      company,
      categories,
      products,
      activeProduct,
      setActiveProduct,
      loading,
      error,
      setActiveClient,
      refreshWorkspace: fetchWorkspaceData
    }}>
      {children}
    </ClientWorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(ClientWorkspaceContext);
  if (context === undefined) {
    return { activeClient: null, availableClients: [], products: [], loading: false, error: null };
  }
  return context;
};
