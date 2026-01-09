
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { User, ChatMessage, UserRole, ChatGroup, ChatSession } from '../types';
import { Send, ArrowLeft, Headset, Users, MessageCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('userId'); 
  const typeParam = queryParams.get('type'); 

  // Default to 'support' if user clicks help button, else community
  const [chatMode, setChatMode] = useState<'support' | 'community' | 'dm'>(targetUserId ? 'dm' : (typeParam as any || 'community'));
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [adminSessions, setAdminSessions] = useState<ChatSession[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
        const session = StorageService.getSession();
        if (!session) return navigate('/login');
        setCurrentUser(session);

        // Fetch Groups
        const allGroups = await StorageService.getChatGroups();
        setGroups(allGroups);
        if(allGroups.length > 0) setActiveGroupId(allGroups[0].id);

        if (session.role === UserRole.ADMIN) {
             const s = await StorageService.getChatSessions();
             setAdminSessions(s);
        } else {
             if (targetUserId) {
                 setChatMode('dm');
                 const target = await StorageService.findUser(targetUserId);
                 if(target) {
                     const s = await StorageService.createOrGetSession(session.id, target.username, target.avatar || '', targetUserId);
                     setActiveSession(s);
                 }
             } else if (typeParam === 'support') {
                 setChatMode('support');
                 const s = await StorageService.createOrGetSession(session.id, session.username, session.avatar || '');
                 setActiveSession(s);
             }
        }
    };
    init();
  }, [targetUserId, typeParam, navigate]);

  useEffect(() => {
    if(!currentUser) return;
    const unsubscribe = StorageService.subscribeToChats((allChats) => {
        if (currentUser.role === UserRole.ADMIN) {
            if (activeSession) {
                setMessages(allChats.filter(c => c.sessionId === activeSession.id));
            } else if (activeGroupId && chatMode === 'community') {
                setMessages(allChats.filter(c => c.groupId === activeGroupId));
            }
        } else {
            if (chatMode === 'community' && activeGroupId) {
                setMessages(allChats.filter(c => c.groupId === activeGroupId));
            } else if ((chatMode === 'support' || chatMode === 'dm') && activeSession) {
                 setMessages(allChats.filter(c => c.sessionId === activeSession.id));
            }
        }
    });
    return () => unsubscribe();
  }, [currentUser, activeSession, activeGroupId, chatMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser) return;
    
    let msg: ChatMessage = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.username,
        content: inputText,
        isRead: false,
        timestamp: new Date().toISOString()
    };

    if (currentUser.role === UserRole.ADMIN) {
        msg.senderId = 'ADMIN'; msg.senderName = 'Administrator';
        if (chatMode === 'community' && activeGroupId) msg.groupId = activeGroupId;
        else if (activeSession) {
            msg.sessionId = activeSession.id;
            msg.receiverId = activeSession.userId;
        }
    } else {
        if (chatMode === 'community' && activeGroupId) {
            msg.groupId = activeGroupId;
        } else {
            if (!activeSession) return;
            msg.sessionId = activeSession.id;
            msg.receiverId = activeSession.receiverId; 
        }
    }

    await StorageService.sendChat(msg);
    setInputText('');
  };

  return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[600px] bg-dark-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
              
              {/* SIDEBAR */}
              <div className="w-full md:w-72 bg-dark-bg/50 border-r border-white/5 flex flex-col">
                  {/* Header Sidebar */}
                  <div className="p-4 border-b border-white/5 flex items-center gap-3">
                      <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={18}/></button>
                      <h1 className="font-bold text-white text-lg">Pesan</h1>
                  </div>

                  {/* Tabs */}
                  <div className="flex p-2 gap-1 border-b border-white/5">
                      <button 
                        onClick={() => { setChatMode('support'); setActiveSession(null); }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${chatMode === 'support' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                          <Headset size={14}/> CS
                      </button>
                      <button 
                        onClick={() => setChatMode('community')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${chatMode === 'community' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                          <Users size={14}/> Umum
                      </button>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {currentUser?.role === UserRole.ADMIN && chatMode === 'support' ? (
                           adminSessions.map(s => (
                               <div key={s.id} onClick={() => setActiveSession(s)} className={`p-3 rounded-xl cursor-pointer hover:bg-white/5 ${activeSession?.id === s.id ? 'bg-white/10 border border-white/10' : ''}`}>
                                   <div className="font-bold text-white text-sm">{s.username}</div>
                                   <div className="text-xs text-gray-500 truncate">{s.topic}</div>
                               </div>
                           ))
                      ) : chatMode === 'community' ? (
                           groups.map(g => (
                               <div key={g.id} onClick={() => setActiveGroupId(g.id)} className={`p-3 rounded-xl cursor-pointer hover:bg-white/5 ${activeGroupId === g.id ? 'bg-white/10 border border-white/10' : ''}`}>
                                   <div className="font-bold text-white text-sm">#{g.name}</div>
                                   <div className="text-xs text-gray-500">Grup Publik</div>
                               </div>
                           ))
                      ) : (
                          // User Support View
                          <div onClick={() => {}} className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <div className="font-bold text-white text-sm">Customer Service</div>
                              <div className="text-xs text-green-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Online</div>
                          </div>
                      )}
                  </div>
              </div>

              {/* CHAT AREA */}
              <div className="flex-1 flex flex-col bg-dark-bg relative">
                   {/* Header Area */}
                   <div className="p-4 border-b border-white/5 bg-dark-card/50 backdrop-blur-md z-10 flex justify-between items-center">
                       <h2 className="font-bold text-white flex items-center gap-2">
                           {chatMode === 'support' ? <><Headset size={20} className="text-brand-400"/> Customer Support</> : 
                            chatMode === 'community' ? <><Users size={20} className="text-purple-400"/> Community Chat</> : 
                            <><MessageCircle size={20} /> Private Message</>}
                       </h2>
                   </div>

                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                       {messages.map(msg => {
                           const isMe = msg.senderId === currentUser?.id || (currentUser?.role === UserRole.ADMIN && msg.senderId === 'ADMIN');
                           return (
                               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-brand-600 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                                       {!isMe && <div className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</div>}
                                       {msg.content}
                                       <div className="text-[9px] opacity-50 text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                   </div>
                               </div>
                           )
                       })}
                       <div ref={messagesEndRef} />
                   </div>
                   
                   <div className="p-4 bg-dark-card border-t border-white/5 flex gap-2">
                       <input 
                           className="flex-1 bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-500 transition-all" 
                           placeholder="Ketik pesan..."
                           value={inputText}
                           onChange={e => setInputText(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSend()}
                       />
                       <button onClick={handleSend} className="bg-brand-600 hover:bg-brand-500 p-3 rounded-xl text-white transition-colors shadow-lg"><Send size={20}/></button>
                   </div>
              </div>
          </div>
      </div>
  );
};

export default Chat;
