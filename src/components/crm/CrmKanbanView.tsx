import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_CONFIG } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Copy, MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface CrmKanbanViewProps {
  leads: any[];
  loading: boolean;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onCopy: (lead: any) => void;
  onViewDetails: (lead: any) => void;
  copiedId: string | null;
  onExportCSV: () => void;
  onExportExcel: () => void;
  emptyIcon: React.ReactNode;
  emptyText: string;
  sourceLabel: string;
}

export const CrmKanbanView: React.FC<CrmKanbanViewProps> = ({
  leads,
  loading,
  onStatusChange,
  onCopy,
  onViewDetails,
  copiedId,
  emptyIcon,
  emptyText,
}) => {
  const columns = Object.keys(LEAD_STATUS_CONFIG);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <Card className="bg-card/40 border-white/5">
        <CardContent className="py-20 text-center flex flex-col items-center justify-center">
          {emptyIcon}
          <p className="text-muted-foreground mt-4 text-sm max-w-sm mx-auto">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId && draggedLeadId === leadId) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== status) {
        onStatusChange(leadId, status);
      }
    }
    setDraggedLeadId(null);
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(l => l.status === status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] items-start">
      {columns.map(statusKey => {
        const config = LEAD_STATUS_CONFIG[statusKey as keyof typeof LEAD_STATUS_CONFIG];
        const statusLeads = getLeadsByStatus(statusKey);
        
        return (
          <div 
            key={statusKey}
            className="flex-shrink-0 w-80 bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col max-h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, statusKey)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: config.color }}></div>
                <h3 className="font-semibold text-sm">{config.label}</h3>
                <Badge variant="secondary" className="text-xs bg-white/5">{statusLeads.length}</Badge>
              </div>
            </div>

            {/* Column Body */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px]">
              {statusLeads.map(lead => (
                <div 
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragEnd={() => setDraggedLeadId(null)}
                  onClick={() => onViewDetails(lead)}
                  className={`bg-card border border-white/[0.08] rounded-lg p-4 cursor-grab hover:border-white/[0.2] transition-colors shadow-sm ${draggedLeadId === lead.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm line-clamp-1">{lead.company || lead.name || lead.company_name || 'Unknown Company'}</h4>
                    <Button variant="ghost" size="icon" className="w-6 h-6 -mt-1 -mr-1" onClick={(e) => { e.stopPropagation(); onCopy(lead); }}>
                      <Copy className={`w-3 h-3 ${copiedId === lead.id ? 'text-green-400' : 'text-muted-foreground'}`} />
                    </Button>
                  </div>
                  
                  {lead.requirement && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {lead.requirement}
                    </p>
                  )}
                  
                  <div className="flex flex-col gap-1.5 mt-auto">
                    {lead.location && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" /> <span className="truncate">{lead.location}</span>
                      </div>
                    )}
                    {lead.created_at && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" /> {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  
                  {/* Lead Score Indicator if exists */}
                  {(lead.quality_score || lead.intent_score || lead.current_score) && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1.5">
                        {lead.quality_score || lead.intent_score || lead.current_score || 0}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
              
              {statusLeads.length === 0 && (
                <div className="h-24 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-muted-foreground/50 text-xs">
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
