import { useState, useRef } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VendorPortfolio = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [location, setLocation] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!profile) return;

    let imageUrl = null;

    if (fileRef.current?.files?.[0]) {
      const file = fileRef.current.files[0];
      const fileName = `portfolio/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("vendor-portfolio")
        .upload(fileName, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message });
        return;
      }

      imageUrl = supabase.storage
        .from("vendor-portfolio")
        .getPublicUrl(fileName).data.publicUrl;
    }

    const { error } = await supabase.from("vendor_projects").insert({
      vendor_id: profile.id,
      title,
      description,
      project_value: Number(value),
      project_location: location,
      image_url: imageUrl,
    });

    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }

    toast({ title: "Project added to portfolio" });

    setTitle("");
    setDescription("");
    setValue("");
    setLocation("");
  };

  return (
    <div className="min-h-screen flex flex-col">

      <Navigation />

      <div className="container mx-auto py-12 flex-1">

        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Add Portfolio Project</CardTitle>
          </CardHeader>

          <CardContent>

            <form onSubmit={handleSubmit} className="space-y-4">

              <Input
                placeholder="Project Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                placeholder="Project Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Input
                placeholder="Project Value (₹)"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />

              <Input
                placeholder="Project Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <input type="file" ref={fileRef} />

              <Button type="submit" className="w-full">
                Add Project
              </Button>

            </form>

          </CardContent>
        </Card>

      </div>

      <Footer />

    </div>
  );
};

export default VendorPortfolio;