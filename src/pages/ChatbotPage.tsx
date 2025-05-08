
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ChatMessage } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export default function ChatbotPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      isBot: true, 
      content: `Hi there! I'm your health assistant. I can answer questions about nutrition, exercise, and general health. How can I help you today?` 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to format message content with Markdown-like syntax
  const formatBotMessage = (content: string) => {
    // Format bullet points
    const bulletPointsFormatted = content.replace(/\n- /g, '\n• ');
    
    // Format numbered lists
    const numberedListsFormatted = bulletPointsFormatted.replace(/\n(\d+)\. /g, '\n$1. ');
    
    // Format paragraphs
    const paragraphsFormatted = numberedListsFormatted
      .split('\n\n')
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join('');
    
    // Return the formatted content or the original if no formatting was done
    return paragraphsFormatted || content;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { isBot: false, content: userMessage }]);
    
    setIsLoading(true);
    
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("health-chat", {
        body: { message: userMessage, profile },
      });

      if (error) throw error;
      
      // Add bot response to chat
      setMessages(prev => [...prev, { isBot: true, content: data.content }]);
      
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Couldn't Send Message",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        isBot: true, 
        content: "Sorry, I'm having trouble connecting right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Health Assistant Chat</h1>
      
      <Card className="neumorphic-card min-h-[70vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Chat with your personal health assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="flex-grow overflow-y-auto mb-4 space-y-4 max-h-[50vh]">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.isBot 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {msg.isBot ? (
                    <div className="prose prose-sm prose-slate prose-invert max-w-none">
                      {msg.content.split("\n").map((line, i) => {
                        // Check if line starts with a bullet point indicator
                        if (line.trim().startsWith('- ')) {
                          return <div key={i} className="flex items-start ml-2 mt-1">
                            <span className="mr-2">•</span>
                            <span>{line.trim().substring(2)}</span>
                          </div>;
                        }
                        // Check if line starts with a number followed by a period (numbered list)
                        else if (/^\d+\.\s/.test(line.trim())) {
                          const [number, ...rest] = line.trim().split(/\.\s/);
                          return <div key={i} className="flex items-start ml-2 mt-1">
                            <span className="mr-2 min-w-[20px]">{number}.</span>
                            <span>{rest.join('. ')}</span>
                          </div>;
                        }
                        // Empty lines become spacing
                        else if (line.trim() === '') {
                          return <div key={i} className="h-2"></div>;
                        }
                        // Regular text
                        else {
                          return <p key={i} className="mb-2">{line}</p>;
                        }
                      })}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about diet, exercise, or health..."
              disabled={isLoading}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
