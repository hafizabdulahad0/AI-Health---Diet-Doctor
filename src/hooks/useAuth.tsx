
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { User, UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  disease?: string;
  dietPreference: 'vegetarian' | 'non-vegetarian' | 'vegan';
  budget: 'low' | 'medium' | 'high';
  goal: 'weight loss' | 'weight gain' | 'maintenance';
  cuisine: string;
}

// Mock data storage (in a real app, this would be an API)
const USERS_KEY = 'health_app_users';
const PROFILES_KEY = 'health_app_profiles';

const getStoredUsers = (): Record<string, User> => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : {};
};

const getStoredProfiles = (): Record<string, UserProfile> => {
  const stored = localStorage.getItem(PROFILES_KEY);
  return stored ? JSON.parse(stored) : {};
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Check if user is logged in on page load
  useEffect(() => {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      const users = getStoredUsers();
      const profiles = getStoredProfiles();
      
      // Find user by ID
      const currentUser = Object.values(users).find(u => u.id === storedUserId) || null;
      const currentProfile = profiles[storedUserId] || null;
      
      setUser(currentUser);
      setProfile(currentProfile);
    }
    
    setLoading(false);
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would be an API call
      const users = getStoredUsers();
      const userEntry = Object.entries(users).find(([_, user]) => user.email === email);
      
      if (!userEntry) {
        toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
        return false;
      }
      
      // In a real app, we would check password hash
      // For demo purposes, we skip password verification
      
      const currentUser = userEntry[1];
      const profiles = getStoredProfiles();
      const currentProfile = profiles[currentUser.id];
      
      if (!currentProfile) {
        toast({ title: "Login failed", description: "Profile not found", variant: "destructive" });
        return false;
      }
      
      // Save user ID to localStorage
      localStorage.setItem('currentUserId', currentUser.id);
      
      setUser(currentUser);
      setProfile(currentProfile);
      
      toast({ title: "Login successful", description: `Welcome back, ${currentProfile.name}!` });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({ title: "Login failed", description: "An error occurred during login", variant: "destructive" });
      return false;
    }
  };
  
  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      // In a real app, this would be an API call
      const users = getStoredUsers();
      
      // Check if email exists
      if (Object.values(users).some(u => u.email === userData.email)) {
        toast({ title: "Signup failed", description: "Email already exists", variant: "destructive" });
        return false;
      }
      
      // Generate a new ID as a string
      const newId = Date.now().toString();
      
      // Create a new user
      const newUser: User = {
        id: newId,
        email: userData.email,
      };
      
      // Create a new profile
      const newProfile: UserProfile = {
        id: newId,
        userId: newId,
        name: userData.name,
        age: userData.age,
        height: userData.height,
        weight: userData.weight,
        gender: userData.gender,
        disease: userData.disease,
        dietPreference: userData.dietPreference,
        budget: userData.budget,
        goal: userData.goal,
        cuisine: userData.cuisine,
      };
      
      // Save to localStorage
      users[newId] = newUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const profiles = getStoredProfiles();
      profiles[newId] = newProfile;
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      
      // Save user ID to localStorage
      localStorage.setItem('currentUserId', newId);
      
      setUser(newUser);
      setProfile(newProfile);
      
      toast({ title: "Signup successful", description: `Welcome, ${newProfile.name}!` });
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      toast({ title: "Signup failed", description: "An error occurred during signup", variant: "destructive" });
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('currentUserId');
    setUser(null);
    setProfile(null);
    toast({ title: "Logged out successfully" });
  };
  
  return (
    <AuthContext.Provider value={{ user, profile, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
