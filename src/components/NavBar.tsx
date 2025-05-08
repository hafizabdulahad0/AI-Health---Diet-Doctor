import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Settings } from "lucide-react";
import { useCheckApiKey } from "@/hooks/useCheckApiKey";
export function NavBar() {
  const {
    user,
    logout
  } = useAuth();
  const {
    openApiKeyModal
  } = useCheckApiKey();
  return <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl text-primary">AI Health & Diet Doctor</Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-primary">
                  Dashboard
                </Link>
                <Link to="/food-analysis" className="text-sm font-medium hover:text-primary">
                  Food Analysis
                </Link>
                <Link to="/chat" className="text-sm font-medium hover:text-primary">
                  Chat
                </Link>
                
                <Button variant="ghost" onClick={logout} size="sm">
                  Logout
                </Button>
              </> : <>
                <Link to="/login" className="text-sm font-medium hover:text-primary">
                  Login
                </Link>
                <Link to="/signup" className="text-sm font-medium hover:text-primary">
                  Sign Up
                </Link>
                <Button variant="ghost" size="sm" onClick={openApiKeyModal}>
                  <Settings size={16} />
                </Button>
              </>}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>;
}