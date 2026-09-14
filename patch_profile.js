import fs from 'fs';

const path = 'src/pages/profile.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to add imports
const importTarget = `import { useToast } from "@/hooks/use-toast";`;
const importReplacement = `import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "@/components/ImageCropper";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";`;
content = content.replace(importTarget, importReplacement);

// State vars
const stateTarget = `const [saving, setSaving] = useState(false);`;
const stateReplacement = `const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  
  // Image Upload State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'banner'>('logo');
  const [uploading, setUploading] = useState(false);`;
content = content.replace(stateTarget, stateReplacement);

// useEffect
const effectTarget = `setPortfolioUrl(profile.portfolio_url || "");`;
const effectReplacement = `setPortfolioUrl(profile.portfolio_url || "");
      setLogoUrl(profile.logo_url || "");
      setBannerUrl(profile.banner_url || "");`;
content = content.replace(effectTarget, effectReplacement);

// handleSave
const saveTarget = `portfolio_url: portfolioUrl,`;
const saveReplacement = `portfolio_url: portfolioUrl,
        logo_url: logoUrl,
        banner_url: bannerUrl,`;
content = content.replace(saveTarget, saveReplacement);

// functions for image upload
const beforeReturnTarget = `return (`;
const beforeReturnReplacement = `
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
      const fileName = \`\${user.id}_\${uuidv4()}.\${fileExt}\`;
      const filePath = \`\${cropType}s/\${fileName}\`;
      
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

  return (`

content = content.replace(beforeReturnTarget, beforeReturnReplacement);

// JSX
const jsxTarget = `<CardContent className="space-y-4">`;
const jsxReplacement = `<CardContent className="space-y-6">
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
`;

content = content.replace(jsxTarget, jsxReplacement);

// Add ImageCropper at the end
const endTarget = `</Card>`;
const endReplacement = `</Card>
          
          <ImageCropper 
            open={cropModalOpen}
            onOpenChange={setCropModalOpen}
            imageSrc={imageToCrop || ''}
            onCropComplete={handleCropComplete}
            aspect={cropType === 'logo' ? 1 : 21/9}
          />`;

content = content.replace(endTarget, endReplacement);

fs.writeFileSync(path, content);
console.log("Patched profile.tsx");
