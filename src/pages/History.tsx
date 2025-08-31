import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  image_url: string;
  uploaded_at: string;
  predictions: {
    disease_name: string;
    confidence: number;
    symptoms: string;
    treatment: string;
    created_at: string;
  }[];
}

const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('plant_images')
      .select(`
        id,
        image_url,
        uploaded_at,
        predictions (
          disease_name,
          confidence,
          symptoms,
          treatment,
          created_at
        )
      `)
      .order('uploaded_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('plant_images')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      setHistory(history.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800";
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-primary">Scan History</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {history.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scans yet</p>
              <Link to="/dashboard">
                <Button className="mt-4">Upload Your First Image</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {history.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Scan from {new Date(item.uploaded_at).toLocaleDateString()}
                      </CardTitle>
                      <CardDescription>
                        {new Date(item.uploaded_at).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={item.image_url}
                        alt="Plant scan"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <div className="space-y-4">
                      {item.predictions.map((prediction, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{prediction.disease_name}</h3>
                            <Badge className={getConfidenceColor(prediction.confidence)}>
                              {prediction.confidence}% confidence
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Symptoms:</strong>
                              <p className="text-muted-foreground">{prediction.symptoms}</p>
                            </div>
                            <div>
                              <strong>Treatment:</strong>
                              <p className="text-muted-foreground">{prediction.treatment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;