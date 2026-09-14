import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '@/contexts/ClientWorkspaceContext';
import { Building, Upload, Save, Globe, MapPin, Mail, Phone, CheckCircle, Image as ImageIcon, Eye, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


const WorkspaceCompanyProfile = () => {
  const { company, refreshWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [completionScore, setCompletionScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (company) {
      const socLinks = company.social_links || {};
      const certs = Array.isArray(company.certificates) ? company.certificates.map((c: any) => c.name || c).join(', ') : '';
      const cats = Array.isArray(company.catalogues) ? company.catalogues.map((c: any) => c.url || c).join(', ') : '';
      const imgs = Array.isArray(company.images) ? company.images.map((c: any) => c.url || c).join(', ') : '';

      setFormData({
        company_name: company.company_name || '',
        industry: company.industry || '',
        business_description: company.business_description || '',
        website: company.website || '',
        email: company.email || '',
        phone: company.phone || '',
        city: company.city || '',
        country: company.country || '',
        address: company.address || '',
        gst: company.gst || '',
        iec: company.iec || '',
        vision: company.vision || '',
        mission: company.mission || '',
        factory_details: company.factory_details || '',
        manufacturing_capacity: company.manufacturing_capacity || '',
        founded_year: company.founded_year || '',
        export_markets: (company.export_markets || []).join(', '),
        certificates: certs,
        social_linkedin: socLinks.linkedin || '',
        social_twitter: socLinks.twitter || '',
        social_facebook: socLinks.facebook || '',
        catalogues: cats,
        images: imgs,
        videos: (company.videos || []).join(', '),
        public_visibility: company.public_visibility || false,
        marketplace_listing_enabled: company.marketplace_listing_enabled || false,
      });
      setLogoPreview(company.logo_url || '');
      setBannerPreview(company.cover_image || '');
      calculateCompletion(company);
    }
  }, [company]);

  const calculateCompletion = (comp: any) => {
    const fieldsToTrack = [
      'company_name', 'industry', 'business_description', 'website', 
      'email', 'phone', 'city', 'country', 'gst', 'iec', 
      'vision', 'mission', 'factory_details', 'logo_url', 'cover_image',
      'manufacturing_capacity', 'founded_year', 'export_markets'
    ];
    let filledCount = 0;
    fieldsToTrack.forEach(field => {
      if (comp[field] && String(comp[field]).trim() !== '') {
        filledCount++;
      }
    });
    setCompletionScore(Math.round((filledCount / fieldsToTrack.length) * 100));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newForm = { ...formData, [e.target.name]: e.target.value };
    setFormData(newForm);
    calculateCompletion({ ...company, ...newForm, logo_url: logoPreview, cover_image: bannerPreview });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Size check (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(previewUrl);
      } else {
        setBannerFile(file);
        setBannerPreview(previewUrl);
      }
      calculateCompletion({ ...company, ...formData, logo_url: type === 'logo' ? previewUrl : logoPreview, cover_image: type === 'banner' ? previewUrl : bannerPreview });
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!company) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${company.id}-${type}-${Date.now()}.${fileExt}`;
    const filePath = `${company.id}/${fileName}`;
    
    if (type === 'logo') setLogoUploading(true);
    else setBannerUploading(true);

    try {
      const { data, error } = await supabase.storage
        .from('company-media')
        .upload(filePath, file);

      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('company-media')
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      return null;
    } finally {
      if (type === 'logo') setLogoUploading(false);
      else setBannerUploading(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      let finalLogoUrl = logoPreview;
      let finalBannerUrl = bannerPreview;

      if (logoFile) {
        const uploadedUrl = await handleFileUpload(logoFile, 'logo');
        if (uploadedUrl) finalLogoUrl = uploadedUrl;
      }
      
      if (bannerFile) {
        const uploadedUrl = await handleFileUpload(bannerFile, 'banner');
        if (uploadedUrl) finalBannerUrl = uploadedUrl;
      }

      const payload = {
        ...formData,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        export_markets: formData.export_markets ? formData.export_markets.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        videos: formData.videos ? formData.videos.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        social_links: {
          linkedin: formData.social_linkedin,
          twitter: formData.social_twitter,
          facebook: formData.social_facebook
        },
        certificates: formData.certificates ? formData.certificates.split(',').map((s: string) => ({ name: s.trim() })).filter((c:any) => c.name) : [],
        catalogues: formData.catalogues ? formData.catalogues.split(',').map((s: string) => ({ url: s.trim() })).filter((c:any) => c.url) : [],
        images: formData.images ? formData.images.split(',').map((s: string) => ({ url: s.trim() })).filter((c:any) => c.url) : [],
        logo_url: finalLogoUrl,
        cover_image: finalBannerUrl
      };
      
      delete payload.social_linkedin;
      delete payload.social_twitter;
      delete payload.social_facebook;

      const { error } = await supabase
        .from('jas_companies')
        .update(payload)
        .eq('id', company.id);

      if (error) throw error;
      
      toast({ title: "Profile Updated", description: "Your company profile has been successfully saved." });
      refreshWorkspace();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Building className="h-8 w-8 text-primary" /> Company Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your business details and profile.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
          Save Changes
        </Button>
      </div>
      
      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
             <div className="flex-1 w-full">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                    Profile Completion 
                    {completionScore === 100 && <CheckCircle className="h-5 w-5 text-green-500" />}
                 </h3>
                 <span className="font-bold text-xl text-primary">{completionScore}%</span>
               </div>
               <Progress value={completionScore} className="h-3 bg-primary/20" />
               <p className="text-sm text-muted-foreground mt-3">
                 {completionScore < 100 
                   ? "Complete your profile to increase trust and visibility." 
                   : "Excellent! A fully completed profile ranks higher in buyer searches."}
               </p>
             </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle>Visibility Settings</CardTitle>
          <CardDescription>Control how your company appears to others.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2"><Eye className="h-4 w-4 text-muted-foreground" /> Public Visibility</Label>
              <p className="text-sm text-muted-foreground">Make your profile visible to registered buyers on the platform.</p>
            </div>
            <Switch 
              checked={formData.public_visibility || false} 
              onCheckedChange={(checked) => handleSwitchChange('public_visibility', checked)} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2"><Store className="h-4 w-4 text-muted-foreground" /> Marketplace Listing</Label>
              <p className="text-sm text-muted-foreground">List your company in the public supplier directory.</p>
            </div>
            <Switch 
              checked={formData.marketplace_listing_enabled || false} 
              onCheckedChange={(checked) => handleSwitchChange('marketplace_listing_enabled', checked)} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Branding & Media</CardTitle>
          <CardDescription>Upload your logo and company banner.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <Label>Company Logo</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 h-48 cursor-pointer hover:bg-muted/40 transition-colors relative overflow-hidden"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                      <Building className="h-8 w-8 text-primary" />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
                      {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4"/>} 
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Recommended 400x400px</p>
                  </>
                )}
                <input type="file" ref={logoInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileChange(e, 'logo')} />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Profile Banner</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 h-48 cursor-pointer hover:bg-muted/40 transition-colors relative overflow-hidden"
                onClick={() => bannerInputRef.current?.click()}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                      <ImageIcon className="h-8 w-8 text-primary" />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
                      {bannerUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4"/>} 
                      Upload Banner
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Recommended 1200x400px</p>
                  </>
                )}
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileChange(e, 'banner')} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details about your business.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input name="company_name" value={formData.company_name || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Industry / Primary Category</Label>
              <Input name="industry" value={formData.industry || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Business Description</Label>
              <Textarea name="business_description" rows={4} value={formData.business_description || ''} onChange={handleChange} placeholder="Describe your business, manufacturing capabilities, and history." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Contact & Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground"/> Website</Label>
              <Input name="website" value={formData.website || ''} onChange={handleChange} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> Contact Email</Label>
              <Input name="email" value={formData.email || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> Contact Phone</Label>
              <Input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+1 234 567 8900" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/> City / Country</Label>
              <div className="flex gap-2">
                <Input name="city" value={formData.city || ''} onChange={handleChange} placeholder="City" />
                <Input name="country" value={formData.country || ''} onChange={handleChange} placeholder="Country" />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Full Address</Label>
              <Textarea name="address" rows={2} value={formData.address || ''} onChange={handleChange} placeholder="Complete physical address..." />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Extended Profile & Compliance</CardTitle>
          <CardDescription>Provide additional details to build trust with buyers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input name="gst" value={formData.gst || ''} onChange={handleChange} placeholder="Ex: 07XXXXX1234X1ZX" />
            </div>
            <div className="space-y-2">
              <Label>IEC (Import Export Code)</Label>
              <Input name="iec" value={formData.iec || ''} onChange={handleChange} placeholder="Ex: 0123456789" />
            </div>
            <div className="space-y-2">
              <Label>Company Vision</Label>
              <Textarea name="vision" rows={3} value={formData.vision || ''} onChange={handleChange} placeholder="Your company's vision statement." />
            </div>
            <div className="space-y-2">
              <Label>Company Mission</Label>
              <Textarea name="mission" rows={3} value={formData.mission || ''} onChange={handleChange} placeholder="Your company's mission statement." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Factory / Production Details</Label>
              <Textarea name="factory_details" rows={3} value={formData.factory_details || ''} onChange={handleChange} placeholder="Information about your manufacturing facilities, capacity, and machinery." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-border pt-4">
            <div className="space-y-2">
              <Label>Year Established</Label>
              <Input type="number" name="founded_year" value={formData.founded_year || ''} onChange={handleChange} placeholder="e.g. 1995" />
            </div>
            <div className="space-y-2">
              <Label>Manufacturing Capacity</Label>
              <Input name="manufacturing_capacity" value={formData.manufacturing_capacity || ''} onChange={handleChange} placeholder="e.g. 1000 tons/month" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Export Markets (Comma separated)</Label>
              <Input name="export_markets" value={formData.export_markets || ''} onChange={handleChange} placeholder="e.g. USA, UK, Germany" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Certificates (Comma separated)</Label>
              <Input name="certificates" value={formData.certificates || ''} onChange={handleChange} placeholder="e.g. ISO 9001, CE Mark" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Catalogue PDFs (Comma separated URLs)</Label>
              <Input name="catalogues" value={formData.catalogues || ''} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Factory Images (Comma separated URLs)</Label>
              <Input name="images" value={formData.images || ''} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Videos (Comma separated URLs)</Label>
              <Input name="videos" value={formData.videos || ''} onChange={handleChange} placeholder="https://..." />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-border pt-4">
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input name="social_linkedin" value={formData.social_linkedin || ''} onChange={handleChange} placeholder="https://linkedin.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Twitter URL</Label>
              <Input name="social_twitter" value={formData.social_twitter || ''} onChange={handleChange} placeholder="https://twitter.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input name="social_facebook" value={formData.social_facebook || ''} onChange={handleChange} placeholder="https://facebook.com/..." />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceCompanyProfile;
