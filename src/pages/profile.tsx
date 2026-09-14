import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "@/components/ImageCropper";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const Profile = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const[portfolioUrl, setPortfolioUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  
  // Image Upload State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'banner'>('logo');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || "");
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setDescription(profile.description || "");
      setPortfolioUrl(profile.portfolio_url || "");
      setLogoUrl(profile.logo_url || "");
      setBannerUrl(profile.banner_url || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: companyName,
        full_name: fullName,
        phone,
        description,
        portfolio_url: portfolioUrl,
        logo_url: logoUrl,
        banner_url: bannerUrl,
      })
      .eq("id", profile?.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your company profile has been saved.",
      });
    }
  };

  
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (e.target.files && e.target.files.length > 0) {
      setCropType(type);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result?.toString() || null);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    
    try {
      const fileExt = 'jpg';
      const fileName = `${user.id}_${uuidv4()}.${fileExt}`;
      const filePath = `${cropType}s/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('seller_assets')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('seller_assets')
        .getPublicUrl(filePath);

      if (cropType === 'logo') {
        setLogoUrl(publicUrl);
      } else {
        setBannerUrl(publicUrl);
      }
      
      toast({ title: 'Image Uploaded', description: 'Make sure to save your profile to apply changes.' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setImageToCrop(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Uploads */}
              <div className="space-y-4">
                <Label>Company Logo & Banner</Label>
                <div className="relative h-32 md:h-48 rounded-xl overflow-hidden bg-muted border border-border group">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">No Banner Uploaded</span>
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectFile(e, 'banner')} disabled={uploading} />
                    <span className="text-white text-sm font-medium flex items-center"><Camera className="w-4 h-4 mr-2" /> Change Banner</span>
                  </label>
                </div>
                
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-muted border-4 border-background -mt-12 md:-mt-16 ml-4 md:ml-8 group z-10 shadow-lg">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                      <span className="text-[10px]">No Logo</span>
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectFile(e, 'logo')} disabled={uploading} />
                    <Camera className="w-5 h-5 text-white" />
                  </label>
                </div>
                {uploading && <p className="text-sm text-primary flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Uploading...</p>}
              </div>

              <Input
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                placeholder="Contact Person Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Textarea
                placeholder="Company Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="space-y-2">
                <Label>Portfolio / Website URL</Label>
                <Input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
          
          <ImageCropper 
            open={cropModalOpen}
            onOpenChange={setCropModalOpen}
            imageSrc={imageToCrop || ''}
            onCropComplete={handleCropComplete}
            aspect={cropType === 'logo' ? 1 : 21/9}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;