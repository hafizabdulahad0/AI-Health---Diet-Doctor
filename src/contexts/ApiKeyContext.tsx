
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiKeySettings } from '@/types';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  hasKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  // Since we're now using a hardcoded API key on the backend, 
  // we'll set hasKey to always be true
  const [apiKey, setApiKeyState] = useState<string | null>("backend-managed");
  const hasKey = true; // Always true now since key is managed on backend

  useEffect(() => {
    // Set a dummy key in localStorage to indicate that we're using backend-managed keys
    localStorage.setItem('openai_api_key', "backend-managed");
  }, []);

  const setApiKey = (key: string) => {
    // This function is kept for compatibility but doesn't do anything meaningful now
    localStorage.setItem('openai_api_key', "backend-managed");
    setApiKeyState("backend-managed");
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, hasKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
