import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { WeightManagerService, WeightProfile } from "@/services/intelligence/admin/WeightManagerService";
import { Loader2, Sliders, Save, Plus } from "lucide-react";

const AdminVerticalWeightManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<WeightProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await WeightManagerService.getProfiles();
      setProfiles(data);
    } catch (err: any) {
      toast({ title: "Error loading profiles", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = (index: number, field: keyof WeightProfile, value: string) => {
    const newProfiles = [...profiles];
    if (field === 'industry' || field === 'version') {
      (newProfiles[index][field] as any) = value;
    } else {
      (newProfiles[index][field] as any) = parseFloat(value) || 0;
    }
    setProfiles(newProfiles);
  };

  const handleSave = async (profile: WeightProfile) => {
    const sum = profile.fit_weight + profile.intent_weight + profile.timing_weight + profile.engagement_weight;
    if (Math.abs(sum - 1.0) > 0.001) {
      toast({ title: "Validation Error", description: "Weights must sum exactly to 1.0", variant: "destructive" });
      return;
    }
    
    try {
      setIsSaving(profile.industry);
      await WeightManagerService.updateProfile(profile);
      toast({ title: "Profile saved successfully" });
    } catch (err: any) {
      toast({ title: "Failed to save profile", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(null);
    }
  };

  const handleAdd = () => {
    setProfiles([...profiles, { industry: 'new_industry', fit_weight: 0.25, intent_weight: 0.25, timing_weight: 0.25, engagement_weight: 0.25, version: 'v1.0', is_active: true }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sliders className="h-8 w-8 text-pink-600" />
              Vertical Weight Manager
            </h1>
            <p className="text-gray-500 mt-2">Configure how the 4 pillars are weighted for different industries.</p>
          </div>
          <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-2" /> Add Industry Profile</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-24"><Loader2 className="h-12 w-12 animate-spin text-pink-600"/></div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Industry Profiles</CardTitle>
              <CardDescription>Weights must sum to 1.0 (100%).</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Industry</TableHead>
                    <TableHead>Fit Wt</TableHead>
                    <TableHead>Intent Wt</TableHead>
                    <TableHead>Timing Wt</TableHead>
                    <TableHead>Engagement Wt</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p, idx) => {
                    const sum = p.fit_weight + p.intent_weight + p.timing_weight + p.engagement_weight;
                    const isError = Math.abs(sum - 1.0) > 0.001;
                    
                    return (
                      <TableRow key={idx} className={isError ? "bg-red-50" : ""}>
                        <TableCell><Input value={p.industry} onChange={(e) => handleUpdate(idx, 'industry', e.target.value)} className="w-32" /></TableCell>
                        <TableCell><Input type="number" step="0.05" value={p.fit_weight} onChange={(e) => handleUpdate(idx, 'fit_weight', e.target.value)} className="w-20" /></TableCell>
                        <TableCell><Input type="number" step="0.05" value={p.intent_weight} onChange={(e) => handleUpdate(idx, 'intent_weight', e.target.value)} className="w-20" /></TableCell>
                        <TableCell><Input type="number" step="0.05" value={p.timing_weight} onChange={(e) => handleUpdate(idx, 'timing_weight', e.target.value)} className="w-20" /></TableCell>
                        <TableCell><Input type="number" step="0.05" value={p.engagement_weight} onChange={(e) => handleUpdate(idx, 'engagement_weight', e.target.value)} className="w-20" /></TableCell>
                        <TableCell><Input value={p.version} onChange={(e) => handleUpdate(idx, 'version', e.target.value)} className="w-24" /></TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleSave(p)} disabled={isSaving === p.industry || isError}>
                            {isSaving === p.industry ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminVerticalWeightManager;
