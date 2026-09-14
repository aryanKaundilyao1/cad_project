import React from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';

const WorkspaceFollowUps = () => {
  const { activeProduct } = useWorkspace();
  return (
    <div className="bg-card rounded-xl border border-border p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold mb-4">WorkspaceFollowUps</h1>
      <p className="text-muted-foreground">This section is currently under development.</p>
      {activeProduct && <p className="mt-4 text-sm font-medium text-primary">Context: {activeProduct.name}</p>}
    </div>
  );
};

export default WorkspaceFollowUps;
