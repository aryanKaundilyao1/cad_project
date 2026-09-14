import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, Mail, Phone, Calendar } from "lucide-react";

export default function WorkspaceGTM() {
  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-editorial font-bold text-foreground">GTM Campaigns</h1>
        <p className="text-foreground/60 mt-1 font-light">
          Orchestrate outbound sequences and marketing campaigns across your scored opportunities.
        </p>
      </div>

      <Card className="border-dashed border-2 shadow-none bg-background/50 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center p-16 text-center h-[400px]">
          <div className="rounded-full bg-primary/5 p-4 mb-4">
             <Megaphone className="h-8 w-8 text-primary/60" />
          </div>
          <h3 className="text-xl font-semibold font-editorial">No active campaigns</h3>
          <p className="text-sm text-foreground/60 mt-2 max-w-md font-light">
            Once you have scored opportunities in your CRM, you can activate them here using multi-channel GTM sequences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
