"use client";

import { useState, useEffect, useRef } from "react";
import { Send, UserCircle, MessageSquare, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ChatSystem() {
  const [activeTab, setActiveTab] = useState<"tenant-lender" | "support">("tenant-lender");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initChat() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Fetch contacts (users you've had messages with)
        // This is a simplified version: fetching users from existing messages
        const { data: sentMsg } = await supabase.from('messages').select('receiver_id').eq('sender_id', user.id);
        const { data: receivedMsg } = await supabase.from('messages').select('sender_id').eq('receiver_id', user.id);
        
        const contactIds = Array.from(new Set([
          ...(sentMsg?.map(m => m.receiver_id) || []),
          ...(receivedMsg?.map(m => m.sender_id) || [])
        ]));

        if (contactIds.length > 0) {
          const { data: userData } = await supabase.from('users').select('id, full_name, email').in('id', contactIds);
          setContacts(userData || []);
          if (userData && userData.length > 0) {
            setSelectedContact(userData[0]);
          }
        }
      }
    }
    initChat();
  }, [supabase]);

  useEffect(() => {
    if (currentUser && selectedContact) {
      // Fetch messages for the selected conversation
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });
        
        setMessages(data || []);
      };

      fetchMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentUser.id}`
          },
          (payload) => {
            if (payload.new.sender_id === selectedContact.id) {
              setMessages(prev => [...prev, payload.new]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, selectedContact, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser || !selectedContact) return;
    
    const newMessage = {
      sender_id: currentUser.id,
      receiver_id: selectedContact.id,
      message: message.trim()
    };

    const { data, error } = await supabase.from('messages').insert(newMessage).select().single();
    
    if (!error && data) {
      setMessages([...messages, data]);
      setMessage("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-5rem)]">
      <div className="glass-panel rounded-2xl h-full flex flex-col md:flex-row overflow-hidden border border-zinc-800">
        
        {/* Sidebar */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-zinc-800 flex flex-col bg-zinc-900/30">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-4">الرسائل</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab("tenant-lender")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "tenant-lender" ? "bg-primary text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
              >
                <MessageSquare className="w-4 h-4" /> الأفراد
              </button>
              <button 
                onClick={() => setActiveTab("support")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "support" ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
              >
                <ShieldAlert className="w-4 h-4" /> الدعم الفني
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {contacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${selectedContact?.id === contact.id ? 'bg-zinc-800 border-zinc-700' : 'bg-transparent border-transparent hover:bg-zinc-800/50'}`}
              >
                <div className="relative">
                  <UserCircle className="w-10 h-10 text-zinc-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{contact.full_name || contact.email.split('@')[0]}</h4>
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <div className="p-4 text-center text-zinc-500 text-sm">لا توجد محادثات نشطة</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          {/* Header */}
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50">
                <UserCircle className="w-10 h-10 text-zinc-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedContact.full_name || selectedContact.email.split('@')[0]}</h3>
                  <p className="text-xs text-green-400">متصل الآن</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl ${msg.sender_id === currentUser?.id ? "bg-primary text-zinc-950 rounded-tr-none" : "bg-zinc-800 text-white rounded-tl-none"}`}>
                      <p className="text-sm mb-1 font-medium">{msg.message}</p>
                      <p className={`text-[10px] text-right ${msg.sender_id === currentUser?.id ? "text-zinc-800" : "text-zinc-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <form onSubmit={handleSend} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 pr-12 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="absolute left-2 top-2 bottom-2 aspect-square bg-primary hover:bg-primary-glow text-zinc-950 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5 -ml-1" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p>اختر محادثة لبدء الدردشة</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

