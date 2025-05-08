
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ExercisePlan } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

export default function ExercisePlanPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("Monday");
  
  useEffect(() => {
    const fetchExercisePlan = async () => {
      if (!profile) return;
      
      try {
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke("generate-exercise-plan", {
          body: { profile },
        });

        if (error) throw error;
        
        setExercisePlan(data as ExercisePlan);
      } catch (error) {
        console.error("Exercise plan error:", error);
        toast({
          title: "Couldn't Load Exercise Plan",
          description: "Failed to load your personalized exercise plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExercisePlan();
  }, [profile, toast]);
  
  // Helper function to format exercise text with bullet points
  const formatExerciseText = (text: string) => {
    if (!text) return <p className="text-gray-500 italic">No exercises specified</p>;
    
    // Split the text into separate exercises/instructions
    const segments = text.split(/(?:\r?\n)+|(?:\.|\;)(?:\s+)/g).filter(segment => segment.trim().length > 0);
    
    if (segments.length === 1) {
      return <p>{text}</p>;
    }
    
    return (
      <ul className="list-disc pl-5 space-y-1">
        {segments.map((segment, index) => (
          <li key={index} className="text-gray-700 dark:text-gray-300">
            {segment.trim().replace(/\.+$/, '')}
          </li>
        ))}
      </ul>
    );
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleGeneratePlan = () => {
    setIsLoading(true);
    const fetchExercisePlan = async () => {
      if (!profile) return;
      
      try {
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke("generate-exercise-plan", {
          body: { profile },
        });

        if (error) throw error;
        
        setExercisePlan(data as ExercisePlan);
        toast({
          title: "Exercise Plan Generated",
          description: "Your personalized exercise plan is ready!",
        });
      } catch (error) {
        console.error("Exercise plan error:", error);
        toast({
          title: "Couldn't Generate Exercise Plan",
          description: "Failed to create your personalized exercise plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExercisePlan();
  };
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">7-Day Exercise Plan</h1>
        <Card className="text-center p-8">
          <p>Generating your personalized exercise plan...</p>
        </Card>
      </div>
    );
  }
  
  if (!exercisePlan) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">7-Day Exercise Plan</h1>
        <Card className="text-center p-8">
          <p className="mb-4">Ready to create your personalized exercise plan?</p>
          <Button onClick={handleGeneratePlan}>Generate Exercise Plan</Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">7-Day Exercise Plan</h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={handleGeneratePlan} variant="outline" disabled={isLoading}>
            {isLoading ? "Generating..." : "Regenerate Plan"}
          </Button>
          <Button onClick={handlePrint} className="print:hidden">
            Print Plan
          </Button>
        </div>
      </div>
      
      <Tabs value={activeDay} onValueChange={setActiveDay}>
        <TabsList className="flex flex-wrap mb-6">
          {Object.keys(exercisePlan).map((day) => (
            <TabsTrigger key={day} value={day} className="flex-grow">
              {day}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.entries(exercisePlan).map(([day, exercises]) => (
          <TabsContent key={day} value={day} className="mt-0">
            <Card className="neumorphic-card bg-gradient-to-br from-slate-950 to-slate-900 text-white">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="text-2xl font-bold text-green-400">{day}'s Workout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div>
                  <h3 className="font-medium text-lg text-green-400 mb-2">Warm-up (5-10 minutes)</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                    {formatExerciseText(exercises.warmup)}
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <h3 className="font-medium text-lg text-green-400 mb-2">Main Workout (20-30 minutes)</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                    {formatExerciseText(exercises.main)}
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <h3 className="font-medium text-lg text-green-400 mb-2">Cool Down (5-10 minutes)</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                    {formatExerciseText(exercises.cooldown)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="hidden print:block mt-8">
        <h2 className="text-2xl font-bold mb-4">Complete 7-Day Exercise Plan</h2>
        <div className="space-y-6">
          {Object.entries(exercisePlan).map(([day, exercises]) => (
            <Card key={day} className="border-t border-border">
              <CardHeader>
                <CardTitle>{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Warm-up (5-10 minutes)</h3>
                  {formatExerciseText(exercises.warmup)}
                </div>
                <div>
                  <h3 className="font-medium">Main Workout (20-30 minutes)</h3>
                  {formatExerciseText(exercises.main)}
                </div>
                <div>
                  <h3 className="font-medium">Cool Down (5-10 minutes)</h3>
                  {formatExerciseText(exercises.cooldown)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
