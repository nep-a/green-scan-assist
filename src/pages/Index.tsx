import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, Camera, History, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

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

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Sprout className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome back to CropCare</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Ready to analyze your crops? Let's keep your plants healthy!
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2">
                  <Camera className="h-5 w-5" />
                  Start Scanning
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="outline" size="lg" className="gap-2">
                  <History className="h-5 w-5" />
                  View History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">CropCare</span>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            AI-Powered Crop Disease Detection
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Protect your crops with advanced AI technology. Upload plant images and get instant 
            disease detection with treatment recommendations.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              <Camera className="h-5 w-5" />
              Start Detecting Diseases
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Camera className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Quick Detection</CardTitle>
              <CardDescription>
                Simply upload or take a photo of your plant for instant AI analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Accurate Results</CardTitle>
              <CardDescription>
                Our AI model is trained on thousands of plant images for reliable diagnosis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Treatment Advice</CardTitle>
              <CardDescription>
                Get detailed symptoms information and actionable treatment recommendations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Create Your Account</h3>
                  <p className="text-muted-foreground">Sign up to start using our disease detection service</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Upload Plant Images</h3>
                  <p className="text-muted-foreground">Take clear photos of affected plant areas</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Get AI Analysis</h3>
                  <p className="text-muted-foreground">Receive instant disease detection with confidence levels</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Follow Treatment Plans</h3>
                  <p className="text-muted-foreground">Implement recommended treatments to save your crops</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>&copy; 2024 CropCare. Helping farmers protect their crops with AI technology.</p>
      </footer>
    </div>
  );
};

export default Index;
