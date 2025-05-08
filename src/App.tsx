
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ApiKeyProvider } from "@/contexts/ApiKeyContext";

import { NavBar } from "@/components/NavBar";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import FoodAnalysisPage from "@/pages/FoodAnalysisPage";
import MealPlanPage from "@/pages/MealPlanPage";
import ExercisePlanPage from "@/pages/ExercisePlanPage";
import ChatbotPage from "@/pages/ChatbotPage";
import NotFoundPage from "@/pages/NotFound";

import PrivateRoute from "@/components/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ApiKeyProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <NavBar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/food-analysis" element={<PrivateRoute><FoodAnalysisPage /></PrivateRoute>} />
                    <Route path="/meal-plan" element={<PrivateRoute><MealPlanPage /></PrivateRoute>} />
                    <Route path="/exercise-plan" element={<PrivateRoute><ExercisePlanPage /></PrivateRoute>} />
                    <Route path="/chat" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />
                    
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ApiKeyProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
