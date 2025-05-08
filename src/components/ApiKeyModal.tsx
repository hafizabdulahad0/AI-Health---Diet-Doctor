
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { setApiKey } = useApiKey();
  const { toast } = useToast();

  const validateApiKey = (key: string): boolean => {
    // Less strict validation - just check if it starts with sk- and has a reasonable length
    const trimmedKey = key.trim();
    return trimmedKey.startsWith('sk-') && trimmedKey.length >= 20;
  };

  const handleSave = async () => {
    if (!key.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }

    if (!validateApiKey(key)) {
      toast({
        title: "Invalid API Key Format",
        description: "OpenAI API keys typically start with 'sk-' and should be at least 20 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);

    try {
      // We're just saving the key, not actually validating with OpenAI here
      // as that would require an API call which is better done in the edge function
      setApiKey(key.trim());
      toast({
        title: "Success",
        description: "API key has been saved successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter OpenAI API Key</DialogTitle>
          <DialogDescription>
            This app requires an OpenAI API key to function. Your key is stored only in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              You'll need an OpenAI API key with access to GPT models. Keys start with "sk-".
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-4 inline-flex items-center"
              >
                OpenAI Platform <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </p>
            <Input
              id="apiKey"
              placeholder="sk-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full"
              type="password"
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={isValidating}>
            {isValidating ? "Validating..." : "Save API Key"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
