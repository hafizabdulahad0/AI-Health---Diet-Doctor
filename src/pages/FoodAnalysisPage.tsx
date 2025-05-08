
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FoodAnalysis } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export default function FoodAnalysisPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [food, setFood] = useState("");
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!food.trim()) {
      toast({
        title: "Food Required",
        description: "Please enter a food item to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { food, profile },
      });

      if (error) throw error;
      
      setAnalysis(data as FoodAnalysis);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${food}`,
      });
    } catch (error) {
      console.error("Food analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the food. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Food Analysis</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Analyze Food Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Enter food item or dish name"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="neumorphic-card">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-lg mb-2">Caloric Value</h3>
                <p className="text-3xl font-bold text-primary">{analysis.calories}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Nutritional Highlights</h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.nutrients.map((nutrient, index) => (
                    <li key={index}>{nutrient}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2 text-green-600">Pros</h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.pros.map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2 text-red-600">Cons</h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.cons.map((con, index) => (
                    <li key={index}>{con}</li>
                  ))}
                </ul>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="font-medium text-lg mb-2">Recommendation</h3>
                <p className="p-4 bg-secondary rounded-lg">{analysis.recommendation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
