import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useIndustries } from "@/hooks/useBusinessProfile";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: industries = [] } = useIndustries();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    start_date: "",
    budget: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // 1. Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          start_date: formData.start_date || null,
          budget: formData.budget ? parseInt(formData.budget) : null,
          client_id: profile.id,
          status: "active",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Add the creator as the owner in project_members
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: project.id,
          user_id: profile.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast({ title: "Project Created Successfully" });
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error creating project", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Workspace Project</DialogTitle>
          <DialogDescription>
            Manually create a project to collaborate with your team or external partners.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input
              required
              placeholder="E.g., Phase 2 Warehouse Construction"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(val) => handleChange("category", val)}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select industry category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                {industries.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="City, State"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estimated Budget (₹)</Label>
            <Input
              type="number"
              placeholder="Optional"
              value={formData.budget}
              onChange={(e) => handleChange("budget", e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label>Project Description</Label>
            <Textarea
              placeholder="Briefly describe the project goals and requirements..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-white/5 border-white/10 resize-none h-24"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
            <Button type="button" variant="outline" onClick={onClose} className="border-white/10">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
