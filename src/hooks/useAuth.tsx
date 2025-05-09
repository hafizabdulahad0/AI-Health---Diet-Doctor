
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types";
import { useToast } from "./use-toast";

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  signup: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateProfile: (updatedProfile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  loading: true,
  updateProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

const storedProfileKey = "health_app_profile";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setUser(data.session.user);
        // Load profile from localStorage if available
        const storedProfile = localStorage.getItem(storedProfileKey);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      }
      setLoading(false);
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        // Load profile from localStorage if available
        const storedProfile = localStorage.getItem(storedProfileKey);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, profileData: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const newProfile: UserProfile = {
          userId: data.user.id,
          name: profileData.name || "",
          age: profileData.age || 0,
          gender: profileData.gender || "",
          height: profileData.height || 0,
          weight: profileData.weight || 0,
          goal: profileData.goal || "",
          dietPreference: profileData.dietPreference || "",
          fitnessLevel: profileData.fitnessLevel || "beginner",
          disease: profileData.disease || "",
          budget: profileData.budget || "medium",
          cuisine: profileData.cuisine || "",
        };

        // Store profile in localStorage
        localStorage.setItem(storedProfileKey, JSON.stringify(newProfile));
        setProfile(newProfile);

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Try to load profile from localStorage
        const storedProfile = localStorage.getItem(storedProfileKey);
        
        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          // Check if the profile belongs to the logged in user
          if (parsedProfile.userId === data.user.id) {
            setProfile(parsedProfile);
          } else {
            // If not the same user, create a new empty profile
            const newProfile: UserProfile = {
              userId: data.user.id,
              name: "",
              age: 0,
              gender: "",
              height: 0,
              weight: 0,
              goal: "",
              dietPreference: "",
              fitnessLevel: "beginner",
              disease: "",
              budget: "medium",
              cuisine: "",
            };
            localStorage.setItem(storedProfileKey, JSON.stringify(newProfile));
            setProfile(newProfile);
          }
        } else {
          // If no profile, create one
          const newProfile: UserProfile = {
            userId: data.user.id,
            name: "",
            age: 0,
            gender: "",
            height: 0,
            weight: 0,
            goal: "",
            dietPreference: "",
            fitnessLevel: "beginner",
            disease: "",
            budget: "medium",
            cuisine: "",
          };
          localStorage.setItem(storedProfileKey, JSON.stringify(newProfile));
          setProfile(newProfile);
        }

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const updateProfile = (updatedProfile: UserProfile) => {
    if (!user || !updatedProfile) return;
    
    // Ensure userId matches the logged in user
    const profileToUpdate = {
      ...updatedProfile,
      userId: user.id,
    };
    
    // Update profile in state
    setProfile(profileToUpdate);
    
    // Save to localStorage
    localStorage.setItem(storedProfileKey, JSON.stringify(profileToUpdate));
  };

  const value = {
    user,
    profile,
    signup,
    login,
    logout,
    loading,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
