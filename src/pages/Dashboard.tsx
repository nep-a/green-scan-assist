import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, LogOut, History, User } from "lucide-react";
import { Link } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);

    const { data: imageData, error: dbError } = await supabase
      .from('plant_images')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
      })
      .select()
      .single();

    if (dbError) {
      toast({
        title: "Error",
        description: "Failed to save image record",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    setUploading(false);
    setAnalyzing(true);

    // Mock AI analysis - replace with actual AI service
    setTimeout(async () => {
      const mockDiseases = [
        { name: "Healthy", confidence: 85.2, symptoms: "No visible symptoms detected", treatment: "Continue regular care and monitoring" },
        { name: "Leaf Spot", confidence: 78.5, symptoms: "Brown spots on leaves, yellowing around edges", treatment: "Remove affected leaves, apply fungicide spray" },
        { name: "Powdery Mildew", confidence: 72.1, symptoms: "White powdery coating on leaves", treatment: "Improve air circulation, apply sulfur-based fungicide" },
        { name: "Rust", confidence: 65.8, symptoms: "Orange/brown spots on leaf undersides", treatment: "Remove infected leaves, apply copper fungicide" },
      ];

      const randomDisease = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];

      await supabase
        .from('predictions')
        .insert({
          plant_image_id: imageData.id,
          disease_name: randomDisease.name,
          confidence: randomDisease.confidence,
          symptoms: randomDisease.symptoms,
          treatment: randomDisease.treatment,
        });

      setAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: `Disease detected: ${randomDisease.name} (${randomDisease.confidence}% confidence)`,
      });
    }, 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Please sign in to access the dashboard.</p>
            <Link to="/auth">
              <Button className="mt-4">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">CropCare Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link to="/history">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Plant Image</CardTitle>
              <CardDescription>
                Take or upload a photo of your plant for AI-powered disease detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {uploading ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p>Uploading image...</p>
                  </div>
                ) : analyzing ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
                    </div>
                    <p>Analyzing image with AI...</p>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <Button onClick={triggerFileInput} className="mb-2">
                        Choose Image
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: JPG, PNG, WebP
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Take photos in good lighting</li>
                  <li>• Focus on affected plant areas</li>
                  <li>• Include close-ups of symptoms</li>
                  <li>• Avoid blurry images</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No recent scans</p>
                  <p className="text-xs">Upload an image to get started</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;