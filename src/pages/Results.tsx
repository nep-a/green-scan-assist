import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2, Camera } from 'lucide-react';

interface PlantImage {
  id: string;
  image_url: string;
  uploaded_at: string;
}

interface Prediction {
  id: string;
  disease_name: string;
  confidence: number;
  symptoms: string;
  treatment: string;
  created_at: string;
}

export default function Results() {
  const { imageId } = useParams<{ imageId: string }>();
  const [image, setImage] = useState<PlantImage | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!imageId) {
      navigate('/dashboard');
      return;
    }

    loadImageAndPrediction();
  }, [user, imageId, navigate]);

  const loadImageAndPrediction = async () => {
    try {
      // Load image data
      const { data: imageData, error: imageError } = await supabase
        .from('plant_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (imageError) throw imageError;
      setImage(imageData);

      // Check if prediction already exists
      const { data: existingPrediction } = await supabase
        .from('predictions')
        .select('*')
        .eq('plant_image_id', imageId)
        .maybeSingle();

      if (existingPrediction) {
        setPrediction(existingPrediction);
      } else {
        // Generate mock prediction (replace with actual AI service)
        await generateMockPrediction(imageId!);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading results',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockPrediction = async (plantImageId: string) => {
    // Mock AI analysis - replace with actual AI service
    const mockDiseases = [
      {
        name: 'Healthy Plant',
        confidence: 95,
        symptoms: 'No visible signs of disease. Plant appears healthy with vibrant green coloration.',
        treatment: 'Continue regular watering and fertilization. Monitor for any changes in appearance.',
      },
      {
        name: 'Late Blight',
        confidence: 87,
        symptoms: 'Dark brown or black lesions on leaves, white moldy growth on undersides of leaves in humid conditions.',
        treatment: 'Remove affected leaves immediately. Apply copper-based fungicide. Improve air circulation and avoid overhead watering.',
      },
      {
        name: 'Powdery Mildew',
        confidence: 92,
        symptoms: 'White, powdery coating on leaves and stems. Leaves may yellow and drop prematurely.',
        treatment: 'Spray with baking soda solution (1 tsp per quart water). Apply neem oil. Ensure good air circulation.',
      },
      {
        name: 'Bacterial Spot',
        confidence: 78,
        symptoms: 'Small, dark spots on leaves with yellow halos. Spots may have a greasy appearance.',
        treatment: 'Remove infected plant parts. Apply copper-based bactericide. Avoid overhead watering and ensure good drainage.',
      },
    ];

    const randomDisease = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];

    const { data, error } = await supabase
      .from('predictions')
      .insert([
        {
          plant_image_id: plantImageId,
          disease_name: randomDisease.name,
          confidence: randomDisease.confidence,
          symptoms: randomDisease.symptoms,
          treatment: randomDisease.treatment,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    setPrediction(data);
  };

  if (!user) return null;

  const isHealthy = prediction?.disease_name === 'Healthy Plant';
  const confidenceColor = prediction?.confidence && prediction.confidence >= 80 ? 'success' : 'warning';

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {loading ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Analyzing your plant...</h2>
              <p className="text-muted-foreground">
                Our AI is examining the image for signs of disease
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Analysis Results
              </h1>
              <p className="text-muted-foreground">
                AI-powered crop disease detection results
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Display */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="mr-2 h-5 w-5" />
                    Uploaded Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {image && (
                    <div className="space-y-4">
                      <img
                        src={image.image_url}
                        alt="Plant analysis"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {new Date(image.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prediction Results */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {isHealthy ? (
                      <CheckCircle className="mr-2 h-5 w-5 text-success" />
                    ) : (
                      <AlertTriangle className="mr-2 h-5 w-5 text-warning" />
                    )}
                    Detection Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prediction && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          {prediction.disease_name}
                        </h3>
                        <Badge variant={confidenceColor === 'success' ? 'default' : 'secondary'}>
                          {prediction.confidence}% Confidence
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Symptoms:</h4>
                        <p className="text-muted-foreground text-sm">
                          {prediction.symptoms}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">
                          {isHealthy ? 'Care Instructions:' : 'Treatment:'}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {prediction.treatment}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center space-x-4">
              <Button asChild>
                <Link to="/dashboard">
                  <Camera className="mr-2 h-4 w-4" />
                  Analyze Another Plant
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/history">
                  View History
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}