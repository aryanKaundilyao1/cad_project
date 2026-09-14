import React from 'react';
import { Search } from 'lucide-react';

export function GlobalSearch() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring sm:text-sm"
        placeholder="Search Accounts, Contacts, Opportunities... (Cmd+K)"
      />
    </div>
  );
}
