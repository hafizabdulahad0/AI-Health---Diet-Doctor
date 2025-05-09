
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Settings, LogOut, Home } from "lucide-react";
import { useCheckApiKey } from "@/hooks/useCheckApiKey";

export function NavBar() {
  const {
    user,
    logout
  } = useAuth();
  const {
    openApiKeyModal
  } = useCheckApiKey();
  return <nav className="bg-background border-b border-border shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl text-primary transition-all duration-300 hover:scale-105">AI Health & Diet Doctor</Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? <>
                <Button variant="ghost" size="icon" className="enhanced-button hover:bg-secondary/60 transition-colors duration-300 shadow-sm hover:shadow-md" asChild>
                  <Link to="/dashboard">
                    <Home size={18} />
                    <span className="sr-only">Dashboard</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={logout} className="enhanced-button hover:bg-secondary/60 transition-colors duration-300 shadow-sm hover:shadow-md">
                  <LogOut size={18} />
                  <span className="sr-only">Logout</span>
                </Button>
              </> : <>
                <Link to="/login" className="text-sm font-medium hover:text-primary transition-all duration-200 hover:scale-105">
                  Login
                </Link>
                <Link to="/signup" className="text-sm font-medium hover:text-primary transition-all duration-200 hover:scale-105">
                  Sign Up
                </Link>
                <Button variant="ghost" size="sm" onClick={openApiKeyModal} className="enhanced-button hover:bg-secondary/60 transition-colors duration-300 shadow-sm hover:shadow-md">
                  <Settings size={16} />
                </Button>
              </>}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>;
}
