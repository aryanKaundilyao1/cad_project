import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Filter } from "lucide-react";

export default function WorkspaceCRM() {
  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-editorial font-bold text-foreground">Pipeline CRM</h1>
        <p className="text-foreground/60 mt-1 font-light">
          Manage active deals, follow-ups, and customer relationships.
        </p>
      </div>

      <Card className="border-dashed border-2 shadow-none bg-background/50 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center p-16 text-center h-[400px]">
          <div className="rounded-full bg-primary/5 p-4 mb-4">
             <Users className="h-8 w-8 text-primary/60" />
          </div>
          <h3 className="text-xl font-semibold font-editorial">Your pipeline is empty</h3>
          <p className="text-sm text-foreground/60 mt-2 max-w-md font-light">
            Deals will appear here automatically when JAS Opportunity Intelligence identifies high-intent leads.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
