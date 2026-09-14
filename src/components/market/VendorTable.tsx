import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateVendorScore, VendorProfile } from "@/utils/vendorScoring";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VendorTableProps {
  location: string;
  projectType: string;
  isPremium: boolean;
}

export const VendorTable = ({ location, projectType, isPremium }: VendorTableProps) => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      // Fetch top vendors
      const { data } = await supabase
        .from("profiles")
        .select("id, company_name, full_name, years_operation, total_reviews, rating, is_verified, company_address")
        .eq("user_type", "company")
        .limit(5);
        
      if (data) {
        setVendors(data as unknown as VendorProfile[]);
      }
      setLoading(false);
    };
    
    fetchVendors();
  }, [location, projectType]);

  if (loading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-full bg-white/5" /><Skeleton className="h-10 w-full bg-white/5" /><Skeleton className="h-10 w-full bg-white/5" /></div>;
  }

  return (
    <div className="rounded-md border border-white/[0.08] overflow-hidden bg-white/[0.02]">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.08] hover:bg-transparent">
            <TableHead>Company</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead className="text-right">Contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map(vendor => {
            const { score, badge, badgeColor, mockPastProjects } = calculateVendorScore(vendor);
            return (
              <TableRow key={vendor.id} className="border-white/[0.04] hover:bg-primary/5">
                <TableCell>
                  <div className="font-medium text-foreground flex items-center gap-2">
                    {vendor.company_name || vendor.full_name}
                    {vendor.is_verified && <ShieldCheck className="h-3 w-3 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{mockPastProjects} Projects Completed</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="font-bold tabular-nums text-foreground">{score}</span>
                    <Badge variant="outline" className={`text-[9px] border px-1 py-0 uppercase tracking-wider ${badgeColor}`}>
                      {badge}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {vendor.years_operation ? `${vendor.years_operation} yrs` : '3 yrs'}
                </TableCell>
                <TableCell className="text-right">
                  {isPremium ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Unlocked</Badge>
                  ) : (
                    <div className="flex items-center justify-end gap-1 text-muted-foreground text-xs">
                      <Lock className="h-3 w-3" /> Locked
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {vendors.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                No verified vendors found in this area yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
