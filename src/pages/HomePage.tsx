import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCheckApiKey } from "@/hooks/useCheckApiKey";
import { Settings } from "lucide-react";
export default function HomePage() {
  const {
    user
  } = useAuth();
  const {
    ApiKeyModalComponent,
    openApiKeyModal
  } = useCheckApiKey();
  return <div className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">LLM Diet Planner</h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-muted-foreground">
          Your personal AI-powered nutrition coach and diet planner.
          Get customized meal plans, food analysis, and health advice tailored to your specific needs.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          {!user ? <>
              <Button size="lg" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </> : <>
              <Button size="lg" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/food-analysis">Food Analysis</Link>
              </Button>
            </>}
        </div>
        
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Personalized Diet Plans</h2>
          <p>Get customized meal plans based on your health goals, dietary preferences, and medical conditions.</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Food Analysis</h2>
          <p>Analyze any food or dish to understand its nutritional value, pros, and cons for your specific health profile.</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">AI Health Assistant</h2>
          <p>Chat with our AI health advisor to get answers to all your diet, nutrition, and exercise questions.</p>
        </div>
      </div>
      
      {ApiKeyModalComponent}
    </div>;
}