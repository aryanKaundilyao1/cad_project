export const QUERY_KEYS = {
  accounts: {
    all: (workspaceId: string) => ['accounts', workspaceId] as const,
    detail: (id: string) => ['account', id] as const,
  },
  contacts: {
    all: (workspaceId: string) => ['contacts', workspaceId] as const,
    detail: (id: string) => ['contact', id] as const,
    byAccount: (accountId: string) => ['contacts', 'account', accountId] as const,
  },
  opportunities: {
    all: (workspaceId: string) => ['opportunities', workspaceId] as const,
    detail: (id: string) => ['opportunity', id] as const,
    intelligence: (id: string) => ['opportunity_intelligence', id] as const,
  },
  execution: {
    tasks: (opportunityId: string) => ['tasks', opportunityId] as const,
    activities: (opportunityId: string) => ['activities', opportunityId] as const,
    timeline: (opportunityId: string) => ['timeline', opportunityId] as const,
  },
  requirements: {
    byOpportunity: (opportunityId: string) => ['requirements', opportunityId] as const,
  },
  stakeholders: {
    byOpportunity: (opportunityId: string) => ['stakeholders', opportunityId] as const,
  }
};
