
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MealPlan } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { useCheckApiKey } from "@/hooks/useCheckApiKey";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

// Type definition for structured meal data
interface MealDetail {
  recipe?: string;
  ingredients?: string[];
  description?: string;
}

export default function MealPlanPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { hasKey } = useApiKey();
  const { ApiKeyModalComponent, openApiKeyModal } = useCheckApiKey();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("Monday");
  
  useEffect(() => {
    const fetchMealPlan = async () => {
      if (!profile) return;
      
      if (!hasKey) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
          body: { profile },
        });

        if (error) throw error;
        
        setMealPlan(data as MealPlan);
      } catch (error) {
        console.error("Meal plan error:", error);
        toast({
          title: "Couldn't Load Meal Plan",
          description: "Failed to load your personalized meal plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMealPlan();
  }, [profile, toast, hasKey]);
  
  // Helper function to parse and format meal data
  const formatMealData = (mealData: any): MealDetail => {
    if (typeof mealData === 'string') {
      try {
        // Try to parse if it's a JSON string
        const parsed = JSON.parse(mealData);
        return parsed;
      } catch {
        // If it's not valid JSON, return it as a description
        return { description: mealData };
      }
    } else if (typeof mealData === 'object' && mealData !== null) {
      // Already an object
      return mealData;
    }
    return { description: String(mealData) };
  };

  // Render a meal with structured data
  const renderMeal = (mealData: any, isCompact: boolean = false) => {
    const meal = formatMealData(mealData);
    
    return (
      <div className={`${isCompact ? 'space-y-2' : 'space-y-3'}`}>
        {meal.recipe && (
          <h4 className={`font-medium ${isCompact ? 'text-base' : 'text-lg'} text-primary`}>
            {meal.recipe}
          </h4>
        )}
        
        {meal.ingredients && meal.ingredients.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Ingredients:</p>
            <ul className={`list-disc pl-5 ${isCompact ? 'text-sm' : 'text-base'} space-y-0.5`}>
              {Array.isArray(meal.ingredients) ? (
                meal.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">{ingredient}</li>
                ))
              ) : (
                <li className="text-gray-700 dark:text-gray-300">{String(meal.ingredients)}</li>
              )}
            </ul>
          </div>
        )}
        
        {meal.description && (
          <p className={`${isCompact ? 'text-sm' : 'text-base'} text-gray-700 dark:text-gray-300 italic`}>
            {meal.description}
          </p>
        )}
        
        {/* If we have neither structured data nor description, show the raw data */}
        {!meal.recipe && !meal.ingredients && !meal.description && (
          <p className="text-gray-700 dark:text-gray-300">
            {typeof mealData === 'object' ? JSON.stringify(mealData) : String(mealData)}
          </p>
        )}
      </div>
    );
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleGeneratePlan = () => {
    if (!hasKey) {
      openApiKeyModal();
      return;
    }
    
    setIsLoading(true);
    const fetchMealPlan = async () => {
      if (!profile) return;
      
      try {
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
          body: { profile },
        });

        if (error) throw error;
        
        setMealPlan(data as MealPlan);
        toast({
          title: "Meal Plan Generated",
          description: "Your personalized meal plan is ready!",
        });
      } catch (error) {
        console.error("Meal plan error:", error);
        toast({
          title: "Couldn't Generate Meal Plan",
          description: "Failed to create your personalized meal plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMealPlan();
  };
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">7-Day Meal Plan</h1>
        <Card className="text-center p-8">
          <p>Generating your personalized meal plan...</p>
        </Card>
      </div>
    );
  }
  
  if (!hasKey) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">7-Day Meal Plan</h1>
        <Card className="text-center p-8">
          <p className="mb-4">You need to set up your OpenAI API key to generate a meal plan.</p>
          <Button onClick={openApiKeyModal}>Configure API Key</Button>
          {ApiKeyModalComponent}
        </Card>
      </div>
    );
  }
  
  if (!mealPlan) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">7-Day Meal Plan</h1>
        <Card className="text-center p-8">
          <p className="mb-4">Ready to create your personalized meal plan?</p>
          <Button onClick={handleGeneratePlan}>Generate Meal Plan</Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">7-Day Meal Plan</h1>
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
          {Object.keys(mealPlan).map((day) => (
            <TabsTrigger key={day} value={day} className="flex-grow">
              {day}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.entries(mealPlan).map(([day, meals]) => (
          <TabsContent key={day} value={day} className="mt-0">
            <Card className="neumorphic-card bg-gradient-to-br from-slate-950 to-slate-900 text-white">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="text-2xl font-bold text-green-400">{day}'s Meals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div>
                  <h3 className="font-medium text-lg text-green-400 mb-2">Breakfast</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                    {renderMeal(meals.breakfast)}
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <h3 className="font-medium text-lg text-green-400 mb-2">Lunch</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                    {renderMeal(meals.lunch)}
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <h3 className="font-medium text-lg text-green-400 mb-2">Dinner</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                    {renderMeal(meals.dinner)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="hidden print:block mt-8">
        <h2 className="text-2xl font-bold mb-4">Complete 7-Day Meal Plan</h2>
        <div className="space-y-8">
          {Object.entries(mealPlan).map(([day, meals]) => (
            <Card key={day} className="border-t border-border">
              <CardHeader>
                <CardTitle>{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg">Breakfast</h3>
                  {renderMeal(meals.breakfast, true)}
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium text-lg">Lunch</h3>
                  {renderMeal(meals.lunch, true)}
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium text-lg">Dinner</h3>
                  {renderMeal(meals.dinner, true)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {ApiKeyModalComponent}
    </div>
  );
}
