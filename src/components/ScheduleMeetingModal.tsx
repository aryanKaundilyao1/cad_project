import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Clock, Mail, Phone, Building2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid?: any;
  // Standalone mode props (when not triggered from a bid)
  targetUserId?: string;
  leadId?: string;
  leadTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactName?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

const ScheduleMeetingModal = ({ isOpen, onClose, bid, targetUserId, leadId, leadTitle, contactPhone, contactEmail, contactName }: ScheduleMeetingModalProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [notes, setNotes] = useState("");
  const [agenda, setAgenda] = useState("");

  // Determine IDs from either bid or standalone props
  const resolvedLeadId = bid?.lead_id || leadId;
  const resolvedAttendeeId = bid?.bidder_id || targetUserId;
  const displayName = bid?.profiles?.company_name || bid?.profiles?.full_name || bid?.contact_person || contactName || "Contact";
  const displayEmail = bid?.contact_email || contactEmail;
  const displayPhone = bid?.contact_phone || contactPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !hour) {
      toast({ title: "Please select a date and time", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Convert 12h to 24h
      let h = parseInt(hour);
      if (period === "AM" && h === 12) h = 0;
      if (period === "PM" && h !== 12) h += 12;
      const time24 = `${String(h).padStart(2, "0")}:${minute}`;

      const scheduledAt = new Date(`${date}T${time24}`).toISOString();
      
      const meetingData: any = {
        workspace_id: profile?.id,
        task_type: "meeting",
        title: `Meeting with ${displayName}`,
        description: `${agenda ? agenda + '\\n' : ''}${notes || ''}`,
        due_date: scheduledAt,
        status: "pending",
        assigned_to: resolvedAttendeeId || profile?.id,
        created_by: profile?.id,
        opportunity_id: resolvedLeadId || null
      };

      const { error } = await supabase.from("tasks").insert(meetingData);

      if (error) throw error;

      // Create notification for the attendee
      if (resolvedAttendeeId) {
        await (supabase as any).from("notifications").insert({
          user_id: resolvedAttendeeId,
          title: "New Meeting Request",
          message: `${profile?.company_name || profile?.full_name || 'Someone'} wants to schedule a meeting on ${date} at ${hour}:${minute} ${period}`,
          type: "meeting_request",
          related_id: resolvedLeadId,
          related_type: "meeting",
        });
      }

      // Create timeline entry for the organizer
      await (supabase as any).from("activities").insert({
        workspace_id: profile?.id,
        activity_type: "meeting",
        title: `Meeting scheduled with ${displayName}`,
        description: `${date} at ${hour}:${minute} ${period}${agenda ? ` — ${agenda}` : ''}`,
        opportunity_id: resolvedLeadId || null,
        created_by: profile?.id
      });

      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Meeting Scheduled ✅", description: `${date} at ${hour}:${minute} ${period}` });
    } catch (error: any) {
      toast({ title: "Error scheduling meeting", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setDate("");
    setHour("12");
    setMinute("00");
    setPeriod("AM");
    setNotes("");
    setAgenda("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px] bg-card border-white/10">
        {success ? (
          /* ── Success State ── */
          <div className="py-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Meeting Scheduled!</h3>
              <p className="text-sm text-muted-foreground">Your meeting request has been sent to {displayName}.</p>
            </div>

            <div className="space-y-2">
              {displayPhone && (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  style={{ borderColor: 'rgba(34,197,94,0.2)', color: '#22C55E' }}
                  onClick={() => window.open(`https://wa.me/${String(displayPhone).replace(/[^0-9]/g, '')}`, '_blank')}
                >
                  <Phone className="h-4 w-4" /> Connect on WhatsApp
                </Button>
              )}
              {displayEmail && (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  style={{ borderColor: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}
                  onClick={() => window.open(`mailto:${displayEmail}`, '_blank')}
                >
                  <Mail className="h-4 w-4" /> Connect on Email
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-white/10"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* ── Form State ── */
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Schedule Meeting</DialogTitle>
              <DialogDescription>
                Set up a time to connect with {displayName}.
              </DialogDescription>
            </DialogHeader>

            {/* Contact Info Preview */}
            <div className="bg-white/5 p-4 rounded-lg mb-2 space-y-2 text-sm text-muted-foreground border border-white/5">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Contact Info
              </h4>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span>{displayEmail || "Email not provided"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>{displayPhone || "Phone not provided"}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> Date
                </Label>
                <Input
                  type="date"
                  required
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              {/* Time — Custom Picker */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Time
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={hour} onValueChange={setHour}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 max-h-56">
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={minute} onValueChange={setMinute}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 max-h-56">
                      {MINUTES.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={period} onValueChange={(v) => setPeriod(v as "AM" | "PM")}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Selected: {hour}:{minute} {period}
                </p>
              </div>

              {/* Agenda */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Agenda (Optional)</Label>
                <Input
                  placeholder="E.g., Pricing discussion, scope review..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes (Optional)</Label>
                <Textarea
                  placeholder="Any additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white/5 border-white/10 resize-none h-20"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                <Button type="button" variant="outline" onClick={handleClose} className="border-white/10">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Meeting
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetingModal;
