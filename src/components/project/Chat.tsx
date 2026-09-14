import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, User, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ChatProps {
  projectId: string;
  messages: any[];
}

const Chat = ({ projectId, messages }: ChatProps) => {
  const { user, profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;
    
    const content = newMessage.trim();
    setNewMessage("");
    
    // Optimistic UI update
    queryClient.setQueryData(["project", projectId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        messages: [...(oldData.messages || []), {
          id: `temp-${Date.now()}`,
          project_id: projectId,
          sender_id: profile.id,
          content: content,
          created_at: new Date().toISOString(),
          profiles: profile
        }]
      };
    });

    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: profile.id,
      content: content
    });

    if (error) {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    }
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const getMessageRole = (senderType: string, isAdmin: boolean) => {
    if (isAdmin) return { label: 'Admin', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20', icon: ShieldCheck };
    if (senderType === 'company') return { label: 'Vendor', color: 'bg-amber-500/20 text-amber-500 border-amber-500/20', icon: User };
    return { label: 'Client', color: 'bg-primary/20 text-primary border-primary/20', icon: User };
  };

  return (
    <Card className="flex flex-col h-[600px] bg-card/40 border-white/5 backdrop-blur-sm">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-lg">Project Activity & Chat</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence>
            {messages?.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages?.map((msg, idx) => {
                const isMe = msg.sender_id === profile?.id;
                const roleInfo = getMessageRole(msg.profiles?.user_type, msg.profiles?.is_admin);
                const Icon = roleInfo.icon;
                
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {!isMe && (
                        <div className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${roleInfo.color}`}>
                          {roleInfo.label}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {msg.profiles?.full_name || msg.profiles?.company_name || 'Unknown User'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
                      isMe 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-white/5 border border-white/10 text-foreground rounded-bl-sm'
                    }`}>
                      <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 border-t border-white/5 bg-black/20">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-white/5 border-white/10 focus-visible:ring-primary/50"
          />
          <Button type="submit" disabled={!newMessage.trim()} className="shrink-0 gap-2">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default Chat;
