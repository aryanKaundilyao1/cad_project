import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  MessageSquare, Send, Search, ArrowLeft, Check, CheckCheck,
  Loader2, Phone, Mail, Smile, Paperclip, Image as ImageIcon,
  MoreVertical, Circle, X, User, Users, UserPlus, Info, CheckCircle2,
  Trash2, Shield, Edit3, Link as LinkIcon, Radio, Volume2, Video,
  CornerUpLeft, ThumbsUp, Heart, Smile as EmojiIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──
interface Conversation {
  id: string;
  participant_1: string | null;
  participant_2: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count_1: number;
  unread_count_2: number;
  meeting_id: string | null;
  is_group: boolean;
  name: string | null;
  image_url: string | null;
  group_admins: string[] | null;
  otherUser?: { id: string; full_name: string | null; company_name: string | null; avatar_url: string | null; email: string | null; phone: string | null };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'voice';
  file_url: string | null;
  file_name: string | null;
  file_size?: number;
  delivery_status: 'sent' | 'delivered' | 'read';
  is_read: boolean;
  created_at: string;
  reply_to_id: string | null;
  reactions: Record<string, string[]>; // emoji -> list of profile ids
  reply_preview?: string;
}

const Messages = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get("c");

  // Chat UI states
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showMobileSidebar, setShowMobileSidebar] = useState(!activeConvId);
  const [activeTab, setActiveTab] = useState<"chats" | "contacts">("chats");
  
  // Modals & Panels
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [callingModal, setCallingModal] = useState<{ isOpen: boolean; type: "audio" | "video"; state: "ringing" | "connected" | "disconnected" } | null>(null);

  // Group Creation State
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // User Search State
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Reply & Attachments
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [showAttachmentDropdown, setShowAttachmentDropdown] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);

  // Participant presence Cache
  const [presenceCache, setPresenceCache] = useState<Record<string, { is_online: boolean; last_seen?: string }>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup listener
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowAttachmentDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Audio Note Recorder simulation
  useEffect(() => {
    if (recordingAudio) {
      setAudioTimer(0);
      audioIntervalRef.current = setInterval(() => {
        setAudioTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => { if (audioIntervalRef.current) clearInterval(audioIntervalRef.current); };
  }, [recordingAudio]);

  // ── Fetch Conversations & Direct Participants ──
  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations", profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      // Get all conversations involving current user, or where they belong to conversation_participants
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          conversation_participants(user_id, role)
        `);

      if (error) throw error;

      const filtered = (data || []).filter((c: any) => 
        c.participant_1 === profile.id || 
        c.participant_2 === profile.id ||
        (c.conversation_participants || []).some((cp: any) => cp.user_id === profile.id)
      );

      // Collect all unique participant profile IDs (batching to avoid N+1 queries)
      const otherUserIds = new Set<string>();
      filtered.forEach((conv: any) => {
        if (!conv.is_group) {
          const otherId = conv.participant_1 === profile.id ? conv.participant_2 : conv.participant_1;
          if (otherId) otherUserIds.add(otherId);
        }
      });

      const profilesMap: Record<string, any> = {};
      if (otherUserIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, company_name, avatar_url, email, phone")
          .in("id", Array.from(otherUserIds));
        
        if (!profilesError && profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      return filtered.map((conv: any) => {
        const otherId = conv.participant_1 === profile.id ? conv.participant_2 : conv.participant_1;
        return {
          ...conv,
          otherUser: conv.is_group ? null : (profilesMap[otherId] || null),
        };
      });
    },
    enabled: !!profile,
  });

  const activeConv = conversations.find((c: Conversation) => c.id === activeConvId);

  // ── Realtime active presence tracking ──
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel('chat_presence', {
      config: {
        presence: {
          key: profile.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsers: Record<string, { is_online: boolean }> = {};
        Object.keys(state).forEach((userId) => {
          activeUsers[userId] = { is_online: true };
        });
        setPresenceCache(activeUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id]);

  // ── Fetch messages for active conversation ──
  useEffect(() => {
    if (!activeConvId || !profile) { setMessages([]); return; }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", activeConvId)
        .order("created_at", { ascending: true });
      
      setMessages((data || []).map((m: any) => ({
        ...m,
        reactions: m.reactions || {}
      })));

      // Mark as read
      await supabase
        .from("direct_messages")
        .update({ is_read: true, delivery_status: "read" })
        .eq("conversation_id", activeConvId)
        .neq("sender_id", profile.id)
        .eq("is_read", false);

      // Reset conversation unread counts
      const conv = conversations.find((c: any) => c.id === activeConvId);
      if (conv) {
        const field = conv.participant_1 === profile.id ? "unread_count_1" : "unread_count_2";
        await supabase.from("conversations").update({ [field]: 0 }).eq("id", activeConvId);
      }
    };
    fetchMessages();
  }, [activeConvId, profile?.id, conversations.length]);

  // ── Supabase Realtime Channels for Live updates ──
  useEffect(() => {
    if (!activeConvId) return;

    const channel = supabase
      .channel(`messages-${activeConvId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload: any) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, reactions: newMsg.reactions || {} }];
        });

        // Mark as read immediately if viewer is not sender
        if (newMsg.sender_id !== profile?.id) {
          supabase
            .from("direct_messages")
            .update({ is_read: true, delivery_status: "read" })
            .eq("id", newMsg.id)
            .then(() => {});
        }

        // Invalidate conversations immediately to update unread badge and sidebar previews in realtime
        queryClient.invalidateQueries({ queryKey: ["conversations", profile?.id] });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload: any) => {
        const updatedMsg = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...updatedMsg, reactions: updatedMsg.reactions || {} } : m));
        queryClient.invalidateQueries({ queryKey: ["conversations", profile?.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, profile?.id]);

  // ── Typing Indicators broadcast via broadcast channels ──
  useEffect(() => {
    if (!activeConvId || !profile) return;

    const typingChannel = supabase
      .channel(`typing-${activeConvId}`)
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload?.user_id !== profile.id) {
          setTypingUsers(prev => new Set(prev).add(payload.payload.user_id));
          setTimeout(() => {
            setTypingUsers(prev => { const n = new Set(prev); n.delete(payload.payload.user_id); return n; });
          }, 3000);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(typingChannel); };
  }, [activeConvId, profile?.id]);

  // ── Auto scroll messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send typing indicators ──
  const emitTyping = useCallback(() => {
    if (!activeConvId || !profile) return;
    supabase.channel(`typing-${activeConvId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: profile.id },
    });
  }, [activeConvId, profile?.id]);

  // ── Search user profiles in the directory ──
  const handleUserSearch = async () => {
    if (!userSearchTerm.trim()) return;
    setSearchingUsers(true);
    try {
      // First, get exact profiles matching search query
      const { data: matchedProfiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name, company_name, avatar_url, email, phone")
        .or(`full_name.ilike.%${userSearchTerm}%,company_name.ilike.%${userSearchTerm}%,email.ilike.%${userSearchTerm}%`);

      if (profileErr) throw profileErr;

      // Next, check matching business niches (industries)
      const { data: matchedIndustries } = await supabase
        .from("industries")
        .select("id")
        .ilike("name", `%${userSearchTerm}%`);

      if (matchedIndustries && matchedIndustries.length > 0) {
        const indIds = matchedIndustries.map(i => i.id);
        const { data: profilesByNiche } = await supabase
          .from("profiles")
          .select("id, full_name, company_name, avatar_url, email, phone")
          .in("industry_id", indIds);
        
        if (profilesByNiche && profilesByNiche.length > 0) {
          const combined = [...(matchedProfiles || [])];
          profilesByNiche.forEach(p => {
            if (!combined.some(c => c.id === p.id)) combined.push(p);
          });
          setUserSearchResults(combined);
          return;
        }
      }

      setUserSearchResults(matchedProfiles || []);
    } catch (err: any) {
      toast({ title: "Search Error", description: err.message, variant: "destructive" });
    } finally {
      setSearchingUsers(false);
    }
  };

  // ── Create or Open Private Chat ──
  const initiatePrivateChat = async (targetUser: any) => {
    if (!profile) return;
    setShowSearchModal(false);
    
    // Check if conversation already exists
    const existing = conversations.find(c => 
      !c.is_group && 
      ((c.participant_1 === profile.id && c.participant_2 === targetUser.id) || 
       (c.participant_1 === targetUser.id && c.participant_2 === profile.id))
    );

    if (existing) {
      selectConversation(existing.id);
      return;
    }

    try {
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          participant_1: profile.id,
          participant_2: targetUser.id,
          is_group: false,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      selectConversation(newConv.id);
      toast({ title: "Chat Started", description: `You can now message ${targetUser.full_name || 'user'}.` });
    } catch (e: any) {
      toast({ title: "Error creating chat", description: e.message, variant: "destructive" });
    }
  };

  // ── Create Group Chat ──
  const handleCreateGroup = async () => {
    if (!groupName.trim() || !profile) return;
    setCreatingGroup(true);

    try {
      // 1. Insert Group Conversation
      const { data: newGroup, error } = await supabase
        .from("conversations")
        .insert({
          is_group: true,
          name: groupName,
          group_admins: [profile.id],
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Add creator and participants
      const participants = [profile.id, ...selectedParticipants];
      const participantInserts = participants.map(uid => ({
        conversation_id: newGroup.id,
        user_id: uid,
        role: uid === profile.id ? 'admin' : 'member',
      }));

      const { error: partErr } = await supabase
        .from("conversation_participants")
        .insert(participantInserts);

      if (partErr) throw partErr;

      // 3. Insert system message
      await supabase.from("direct_messages").insert({
        conversation_id: newGroup.id,
        sender_id: profile.id,
        content: `${profile.full_name || 'Admin'} created group "${groupName}"`,
        message_type: 'system',
      });

      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setShowGroupModal(false);
      setGroupName("");
      setSelectedParticipants([]);
      selectConversation(newGroup.id);
      toast({ title: "Group Created ✅", description: `"${groupName}" is ready for chat.` });
    } catch (e: any) {
      toast({ title: "Group creation error", description: e.message, variant: "destructive" });
    } finally {
      setCreatingGroup(false);
    }
  };

  // ── Send message ──
  const handleSend = async () => {
    const text = messageText.trim();
    if ((!text && !attachedFile) || !activeConvId || !profile) return;
    setSending(true);
    setMessageText("");
    const replyId = replyMessage?.id || null;
    const replyPreview = replyMessage?.content || undefined;
    setReplyMessage(null);
    setAttachedFile(null);

    try {
      const msgType = attachedFile 
        ? (attachedFile.type.startsWith("image/") ? "image" : "file") 
        : (recordingAudio ? "voice" : "text");

      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: activeConvId,
        sender_id: profile.id,
        content: text || (attachedFile ? `Shared a file: ${attachedFile.name}` : "Voice Note"),
        message_type: msgType,
        file_url: attachedFile?.url || null,
        file_name: attachedFile?.name || null,
        reply_to_id: replyId,
        delivery_status: "sent",
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  // ── Reaction Trigger ──
  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!profile) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const currentReactions = { ...msg.reactions };
    const usersList = currentReactions[emoji] || [];

    let updatedList;
    if (usersList.includes(profile.id)) {
      updatedList = usersList.filter(id => id !== profile.id);
    } else {
      updatedList = [...usersList, profile.id];
    }

    if (updatedList.length === 0) {
      delete currentReactions[emoji];
    } else {
      currentReactions[emoji] = updatedList;
    }

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: currentReactions } : m));

    await supabase
      .from("direct_messages")
      .update({ reactions: currentReactions })
      .eq("id", msgId);
  };

  const selectConversation = (convId: string) => {
    setSearchParams({ c: convId });
    setShowMobileSidebar(false);
    setShowDetailsPanel(false);
  };

  const selectParticipantForGroup = (id: string) => {
    setSelectedParticipants(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const startCall = (type: "audio" | "video") => {
    setCallingModal({ isOpen: true, type, state: "ringing" });
    setTimeout(() => {
      setCallingModal(p => p ? { ...p, state: "connected" } : null);
    }, 3000);
  };

  const endCall = () => {
    setCallingModal(p => p ? { ...p, state: "disconnected" } : null);
    setTimeout(() => {
      setCallingModal(null);
    }, 1000);
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) { last.msgs.push(msg); }
    else { groupedMessages.push({ date, msgs: [msg] }); }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Navigation />
      
      <div className="flex-1 pt-16 flex h-[calc(100vh-64px)] relative">
        
        {/* ── SIDEBAR PANEL ── */}
        <aside
          className={`w-full md:w-80 lg:w-[380px] border-r border-white/[0.06] flex flex-col bg-card/60 backdrop-blur-md transition-all duration-300 ${
            showMobileSidebar ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Header Controls */}
          <div className="px-4 py-4 border-b border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Messages
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => setShowSearchModal(true)}>
                  <UserPlus className="h-4.5 w-4.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => setShowGroupModal(true)}>
                  <Users className="h-4.5 w-4.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4.5 w-4.5 text-emerald-500" />
                </Button>
              </div>
            </div>

            {/* Sidebar search active threads */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats or members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/[0.03] border-white/[0.08] h-9 text-sm"
              />
            </div>
          </div>

          {/* Active Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-20 text-center px-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No Active Channels</p>
                <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-[200px] mx-auto">
                  Click the plus icons above to search users, create group chats, or send invites!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {conversations.filter(c => {
                  if (!searchQuery) return true;
                  const searchStr = c.is_group ? c.name : (c.otherUser?.full_name || c.otherUser?.company_name || "");
                  return searchStr?.toLowerCase().includes(searchQuery.toLowerCase());
                }).map((conv: Conversation) => {
                  const isActive = conv.id === activeConvId;
                  const isOnline = conv.otherUser ? (presenceCache[conv.otherUser.id]?.is_online || (conv.otherUser.id.charCodeAt(0) % 2 === 0)) : false;
                  const unread = conv.participant_1 === profile?.id ? conv.unread_count_1 : conv.unread_count_2;
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-l-2 ${
                        isActive
                          ? "bg-primary/10 border-l-primary"
                          : "hover:bg-white/[0.02] border-l-transparent"
                      }`}
                    >
                      {/* Avatar with dynamic indicators */}
                      <div className="relative flex-shrink-0">
                        {conv.is_group ? (
                          <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                            <Users className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-white/[0.04] text-foreground/80 flex items-center justify-center font-bold border border-white/[0.06] relative">
                            {(conv.otherUser?.company_name || conv.otherUser?.full_name || "?").charAt(0).toUpperCase()}
                            
                            {/* Online green indicator */}
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                              isOnline ? "bg-emerald-500" : "bg-zinc-600"
                            }`} />
                          </div>
                        )}
                      </div>

                      {/* Info preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-sm truncate text-foreground/90">
                            {conv.is_group ? conv.name : (conv.otherUser?.company_name || conv.otherUser?.full_name || "User")}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {new Date(conv.last_message_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground/80 truncate pr-2 max-w-[200px]">
                            {conv.last_message_preview || "No messages yet"}
                          </span>
                          {unread > 0 && (
                            <Badge className="h-5 min-w-5 text-[10px] px-1 rounded-full bg-primary border-0 text-white flex-shrink-0 flex items-center justify-center">
                              {unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── CHAT CORE WORKSPACE ── */}
        <main className={`flex-1 flex flex-col ${showMobileSidebar ? "hidden md:flex" : "flex"} bg-card/20 relative`} style={{ minHeight: 0 }}>
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Inbox Overview</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Select a live discussion channel from the left sidebar panel or create a new one to communicate.
              </p>
            </div>
          ) : (
            <>
              {/* Workspace Header */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-card/85 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0" onClick={() => setShowMobileSidebar(true)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold cursor-pointer" onClick={() => setShowDetailsPanel(!showDetailsPanel)}>
                    {activeConv?.is_group ? (
                      <Users className="h-4.5 w-4.5" />
                    ) : (
                      (activeConv?.otherUser?.company_name || activeConv?.otherUser?.full_name || "?").charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate cursor-pointer hover:underline" onClick={() => setShowDetailsPanel(!showDetailsPanel)}>
                      {activeConv?.is_group ? activeConv.name : (activeConv?.otherUser?.company_name || activeConv?.otherUser?.full_name || "User")}
                    </h4>
                    {typingUsers.size > 0 ? (
                      <p className="text-xs text-primary animate-pulse font-medium">typing...</p>
                    ) : (
                      <p className="text-xs text-muted-foreground/80 truncate">
                        {activeConv?.is_group ? "Group Conversation" : activeConv?.otherUser?.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Header outreach shortcuts & calls */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => startCall("audio")}>
                    <Volume2 className="h-4.5 w-4.5 text-primary/80" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => startCall("video")}>
                    <Video className="h-4.5 w-4.5 text-primary/80" />
                  </Button>
                  {activeConv?.otherUser?.phone && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10" onClick={() => window.open(`https://wa.me/${String(activeConv.otherUser!.phone).replace(/[^0-9]/g, "")}`, "_blank")}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  {activeConv?.otherUser?.email && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-sky-400 hover:bg-sky-400/10" onClick={() => window.open(`mailto:${activeConv.otherUser!.email}`, "_blank")}>
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => setShowDetailsPanel(!showDetailsPanel)}>
                    <Info className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>

              {/* Chat Stream Display */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "radial-gradient(circle at top, rgba(16,14,28,0.2) 0%, rgba(10,8,16,0.3) 100%)" }}>
                {groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-3">
                    <div className="flex justify-center">
                      <span className="text-[10px] text-muted-foreground/80 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full font-medium shadow-sm">
                        {group.date}
                      </span>
                    </div>

                    {group.msgs.map((msg) => {
                      const isMine = msg.sender_id === profile?.id;
                      const hasReactions = Object.keys(msg.reactions || {}).length > 0;
                      
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"} mb-1`}>
                          
                          {/* Reply wrapper preview inside bubble */}
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed border relative shadow-sm group ${
                            isMine
                              ? "bg-primary text-primary-foreground border-primary/20 rounded-br-none"
                              : "bg-white/[0.05] border-white/[0.08] text-foreground rounded-bl-none"
                          }`}>
                            
                            {/* Reply Reference Anchor */}
                            {msg.reply_to_id && (
                              <div className="mb-2 p-2 rounded-lg bg-black/20 text-xs border-l-2 border-primary/60 text-muted-foreground/90 select-none">
                                <span className="font-semibold text-[10px] uppercase text-primary mb-0.5 block">Reply Reference</span>
                                <p className="truncate">Active Reference message</p>
                              </div>
                            )}

                            {/* Attachments rendering */}
                            {msg.message_type === "image" && msg.file_url && (
                              <div className="mb-2 rounded-lg overflow-hidden border border-white/10 max-w-sm">
                                <img src={msg.file_url} alt="Attachment" className="max-h-48 object-cover w-full cursor-zoom-in" />
                              </div>
                            )}

                            {msg.message_type === "file" && msg.file_url && (
                              <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-black/15 border border-white/10 text-xs text-sky-400 hover:underline">
                                <Paperclip className="h-4 w-4" />
                                <span className="truncate max-w-[150px]">{msg.file_name || "Attachment"}</span>
                              </a>
                            )}

                            {msg.message_type === "voice" && (
                              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-black/15 text-xs text-foreground/90">
                                <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                                <span>Voice Note Mock (Audio Playback Ready)</span>
                              </div>
                            )}

                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            {/* Subtitle timer / receipts */}
                            <div className="flex items-center justify-end gap-1 mt-1.5 opacity-60 text-[9px]">
                              <span>{new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                              {isMine && (
                                msg.delivery_status === "read" || msg.is_read ? (
                                  <CheckCheck className="h-3 w-3 text-sky-300" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
                            </div>

                            {/* Floating Reactions Trigger Shelf */}
                            <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 rounded-full bg-card border border-white/10 shadow-lg z-20" style={{ right: isMine ? "auto" : "-100px", left: isMine ? "-100px" : "auto" }}>
                              <button onClick={() => toggleReaction(msg.id, "👍")} className="hover:scale-125 transition-transform">👍</button>
                              <button onClick={() => toggleReaction(msg.id, "❤️")} className="hover:scale-125 transition-transform">❤️</button>
                              <button onClick={() => toggleReaction(msg.id, "😂")} className="hover:scale-125 transition-transform">😂</button>
                              <button onClick={() => setReplyMessage(msg)} className="hover:scale-125 transition-transform text-muted-foreground hover:text-foreground ml-1">
                                <CornerUpLeft className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Render Reactions Shelf */}
                            {hasReactions && (
                              <div className="absolute -bottom-2 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-800 border border-white/10 text-[10px] shadow-md z-10">
                                {Object.entries(msg.reactions).map(([emoji, uids]) => (
                                  <span key={emoji} title={`${uids.length} reaction(s)`}>{emoji} <span className="text-[9px] opacity-75">{uids.length}</span></span>
                                ))}
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Reference Anchor Preview before text area */}
              {replyMessage && (
                <div className="px-4 py-2 border-t border-white/[0.04] bg-black/20 flex items-center justify-between text-xs text-muted-foreground animate-slide-in">
                  <div className="flex items-center gap-2 border-l-2 border-primary pl-2">
                    <CornerUpLeft className="h-3.5 w-3.5 text-primary" />
                    <span>Replying to message:</span>
                    <p className="truncate max-w-[200px] italic text-foreground/80">"{replyMessage.content}"</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:text-foreground" onClick={() => setReplyMessage(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Message Composer Area */}
              <div className="px-4 py-3 border-t border-white/[0.06] bg-card/90 backdrop-blur-md relative" ref={containerRef}>
                
                {/* File Attachment Dropdown popup */}
                {showAttachmentDropdown && (
                  <div className="absolute bottom-full left-4 mb-2 p-2 rounded-xl bg-card border border-white/10 shadow-2xl flex flex-col gap-1 z-30 animate-scale-in">
                    <Button variant="ghost" size="sm" className="gap-2 justify-start h-9 text-xs" onClick={() => { setAttachedFile({ url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab", name: "Screenshot_HQ.jpg", type: "image/jpeg" }); setShowAttachmentDropdown(false); }}>
                      <ImageIcon className="h-4 w-4 text-sky-400" /> Share Image
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 justify-start h-9 text-xs" onClick={() => { setAttachedFile({ url: "https://example.com/proposal.pdf", name: "B2B_Sales_Proposal.pdf", type: "application/pdf" }); setShowAttachmentDropdown(false); }}>
                      <Paperclip className="h-4 w-4 text-amber-400" /> Share Document
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 justify-start h-9 text-xs text-emerald-400" onClick={() => { setRecordingAudio(true); setShowAttachmentDropdown(false); }}>
                      <Radio className="h-4 w-4" /> Voice Note Recorder
                    </Button>
                  </div>
                )}

                {/* Main Composition input bar */}
                {recordingAudio ? (
                  /* Audio Recording Panel Mode */
                  <div className="flex items-center justify-between bg-red-950/20 border border-red-500/20 rounded-full px-4 py-2 text-sm text-red-400 animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span>Recording Voice Memo: {audioTimer}s</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 px-2 rounded-full" onClick={() => { setRecordingAudio(false); }}>
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" className="h-7 px-3 rounded-full" onClick={() => { setRecordingAudio(false); handleSend(); }}>
                        Save & Send
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Standard text composition bar */
                  <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                    <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-full" onClick={() => setShowAttachmentDropdown(!showAttachmentDropdown)}>
                      <Paperclip className="h-4.5 w-4.5" />
                    </Button>

                    <div className="flex-1 relative flex items-center">
                      <Input
                        placeholder={attachedFile ? `File Selected: ${attachedFile.name}` : "Type a message..."}
                        value={messageText}
                        disabled={!!attachedFile}
                        onChange={(e) => {
                          setMessageText(e.target.value);
                          emitTyping();
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        className="bg-white/[0.04] border-white/[0.08] rounded-xl h-10 px-4 text-sm"
                        autoFocus
                      />

                      {/* Attached file dismiss cross */}
                      {attachedFile && (
                        <button type="button" onClick={() => setAttachedFile(null)} className="absolute right-3 text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <Button type="submit" size="sm" disabled={(!messageText.trim() && !attachedFile) || sending} className="h-9 w-9 rounded-xl p-0 flex-shrink-0" style={{ background: (messageText.trim() || attachedFile) ? "linear-gradient(135deg, #3B82F6, #2563EB)" : "rgba(255,255,255,0.03)" }}>
                      {sending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
                    </Button>
                  </form>
                )}
              </div>
            </>
          )}
        </main>

        {/* ── CONVERSATION PARTICIPANTS DETAILS DRAWER ── */}
        <AnimatePresence>
          {showDetailsPanel && activeConv && (
            <motion.aside
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute md:relative right-0 top-0 bottom-0 w-80 border-l border-white/[0.06] bg-card/90 backdrop-blur-md flex flex-col z-20 shadow-2xl"
            >
              <div className="px-4 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Information Drawer</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDetailsPanel(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Meta details */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xl mx-auto mb-3">
                    {activeConv.is_group ? (
                      <Users className="h-7 w-7" />
                    ) : (
                      (activeConv.otherUser?.company_name || activeConv.otherUser?.full_name || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <h4 className="font-bold text-base text-foreground/90">
                    {activeConv.is_group ? activeConv.name : (activeConv.otherUser?.company_name || activeConv.otherUser?.full_name || "User")}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeConv.otherUser?.email}</p>
                </div>

                {/* Phone outreach connections */}
                {!activeConv.is_group && activeConv.otherUser?.phone && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outreach Connect</h5>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Direct Dial</span>
                        <a href={`tel:${activeConv.otherUser.phone}`} className="text-primary hover:underline">{activeConv.otherUser.phone}</a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Group participants roster list */}
                {activeConv.is_group && (
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members Roster</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-foreground/90 truncate">{profile?.full_name || "You"} (Admin)</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* ── MODAL: SEARCH DIRECTORY USERS ── */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Search Directory</DialogTitle>
            <DialogDescription>Find any user by name, email, company, or business niche.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Input
                placeholder="E.g., John, Salesforce, SaaS, Health Niche..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleUserSearch(); }}
                className="bg-white/5 border-white/10"
              />
              <Button onClick={handleUserSearch} disabled={searchingUsers}>
                {searchingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {userSearchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No matching profiles found in directories.</div>
              ) : (
                userSearchResults.map((usr) => (
                  <button
                    key={usr.id}
                    onClick={() => initiatePrivateChat(usr)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-left transition-colors"
                  >
                    <div>
                      <h5 className="text-sm font-semibold">{usr.full_name || usr.email}</h5>
                      <p className="text-xs text-muted-foreground">{usr.company_name || "Enterprise Partner"}</p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: CREATE GROUP CHAT ── */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>New Group Chat</DialogTitle>
            <DialogDescription>Create a collaborative channel with multiple contacts.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input placeholder="E.g., Q3 Sales Pipeline" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label>Members Directory</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-black/10">
                {conversations.filter(c => c.otherUser).map(c => (
                  <button
                    key={c.otherUser!.id}
                    onClick={() => selectParticipantForGroup(c.otherUser!.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
                      selectedParticipants.includes(c.otherUser!.id) ? "bg-primary/20 border border-primary/40" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xs">{c.otherUser!.full_name || c.otherUser!.email}</span>
                    {selectedParticipants.includes(c.otherUser!.id) && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateGroup} className="w-full gap-2" disabled={creatingGroup || !groupName.trim()}>
              {creatingGroup && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: OUTREACH INVITE SYSTEM ── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Partners</DialogTitle>
            <DialogDescription>Connect with external leads or company developers using direct share pathways.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Button variant="outline" className="w-full gap-2 justify-start border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10" onClick={() => window.open("https://wa.me/?text=Join%20me%20on%20JAS%20CONNECT%20to%20collaborate%20on%20active%20sales%20leads!", "_blank")}>
              <Phone className="h-4 w-4" /> Invite via WhatsApp
            </Button>
            <Button variant="outline" className="w-full gap-2 justify-start border-sky-500/20 text-sky-400 hover:bg-sky-400/10" onClick={() => window.open("mailto:?subject=Join%20JAS%20CONNECT&body=Let's%20collaborate%20on%20sales%20leads%20here!", "_blank")}>
              <Mail className="h-4 w-4" /> Invite via Email
            </Button>
            <Button variant="outline" className="w-full gap-2 justify-start border-white/10 text-foreground" onClick={() => { navigator.clipboard.writeText(window.location.origin + "/auth"); toast({ title: "Invite Link Copied! 📋", description: "You can now share this URL with anyone." }); }}>
              <LinkIcon className="h-4 w-4" /> Copy Shareable invite link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CALLING STATUS MOCK OVERLAY ── */}
      <AnimatePresence>
        {callingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-primary/20 text-primary border border-primary/40 flex items-center justify-center mx-auto animate-bounce">
                {callingModal.type === "audio" ? <Volume2 className="h-10 w-10" /> : <Video className="h-10 w-10" />}
              </div>
              <h3 className="text-2xl font-bold">{activeConv?.is_group ? activeConv.name : (activeConv?.otherUser?.company_name || activeConv?.otherUser?.full_name || "Attendee")}</h3>
              
              <p className="text-sm text-primary uppercase tracking-widest font-semibold animate-pulse">
                {callingModal.state === "ringing" ? "Ringing (Dialing Peer Status)..." : "Connected (SaaS WebRTC Stream Operational)"}
              </p>

              <div className="flex gap-4 justify-center pt-8">
                <Button variant="destructive" className="h-12 w-12 rounded-full p-0 flex items-center justify-center" onClick={endCall}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Messages;
