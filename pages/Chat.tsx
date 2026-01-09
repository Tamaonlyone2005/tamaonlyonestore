
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { User, ChatMessage, UserRole, ChatGroup, ChatSession } from '../types';
import { Send, Users, Plus, Check, MicOff, Shield, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/Toast';
import UserAvatar from '../components/UserAvatar';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Params for DM
  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('userId'); // If DM
  const typeParam = queryParams.get('type'); // 'support' | 'community'

  const [chatMode, setChatMode] = useState<'support' | 'community' | 'dm'>(targetUserId ? 'dm' : (typeParam as any || 'support'));
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Admin List
  const [adminSessions, setAdminSessions] = useState<ChatSession[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
        const session = StorageService.getSession();
        if (!session) return navigate('/login');
        setCurrentUser(session);

        // Fetch Groups
        setGroups(await StorageService.getChatGroups());

        // Setup Session
        if (session.role === UserRole.ADMIN) {
             const s = await StorageService.getChatSessions();
             setAdminSessions(s);
        } else {
             if (targetUserId) {
                 // DM Mode
                 const target = await StorageService.findUser(targetUserId);
                 if(target) {
                     const s = await StorageService.createOrGetSession(session.id, target.username, target.avatar || '', targetUserId);
                     setActiveSession(s);
                 }
             } else if (chatMode === 'support') {
                 // Support Mode
                 const s = await StorageService.createOrGetSession(session.id, session.username, session.avatar || '');
                 setActiveSession(s);
             }
        }
    };
    init();
  }, [targetUserId, chatMode, navigate]);

  // Real-time Chat Subscription
  useEffect(() => {
    if(!currentUser) return;
    
    const unsubscribe = StorageService.subscribeToChats((allChats) => {
        if (currentUser.role === UserRole.ADMIN) {
            // Admin Logic
            if (activeSession) {
                setMessages(allChats.filter(c => c.sessionId === activeSession.id));
            } else if (activeGroupId) {
                setMessages(allChats.filter(c => c.groupId === activeGroupId));
            }
        } else {
            // Member Logic
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
        if (activeGroupId) msg.groupId = activeGroupId;
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
      <div className="max-w-4xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col">
          <div className="flex items-center gap-4 mb-4">
              <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></button>
              <h1 className="text-xl font-bold text-white">
                  {currentUser?.role === UserRole.ADMIN ? 'Admin Chat Panel' : 
                   chatMode === 'dm' ? `Chat with ${activeSession?.username || 'User'}` : 
                   chatMode === 'community' ? 'Community Chat' : 'Customer Support'}
              </h1>
          </div>

          <div className="flex-1 bg-dark-card border border-white/5 rounded-2xl overflow-hidden flex">
              {/* Sidebar (Admin or Community Groups) */}
              {(currentUser?.role === UserRole.ADMIN || chatMode === 'community') && (
                  <div className="w-64 border-r border-white/5 bg-dark-bg/50 overflow-y-auto hidden md:block">
                      {currentUser?.role === UserRole.ADMIN ? (
                           <div>
                               <div className="p-3 text-xs font-bold text-gray-500">ACTIVE SESSIONS</div>
                               {adminSessions.map(s => (
                                   <div key={s.id} onClick={() => setActiveSession(s)} className={`p-3 cursor-pointer hover:bg-white/5 ${activeSession?.id === s.id ? 'bg-brand-600/20' : ''}`}>
                                       <div className="font-bold text-white text-sm">{s.username}</div>
                                       <div className="text-xs text-gray-500">{s.topic}</div>
                                   </div>
                               ))}
                           </div>
                      ) : (
                           <div>
                               <div className="p-3 text-xs font-bold text-gray-500">ROOMS</div>
                               {groups.map(g => (
                                   <div key={g.id} onClick={() => setActiveGroupId(g.id)} className={`p-3 cursor-pointer hover:bg-white/5 ${activeGroupId === g.id ? 'bg-brand-600/20' : ''}`}>
                                       #{g.name}
                                   </div>
                               ))}
                           </div>
                      )}
                  </div>
              )}

              {/* Chat Area */}
              <div className="flex-1 flex flex-col bg-dark-bg relative">
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                       {messages.map(msg => {
                           const isMe = msg.senderId === currentUser?.id || (currentUser?.role === UserRole.ADMIN && msg.senderId === 'ADMIN');
                           return (
                               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe ? 'bg-brand-600 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                                       {!isMe && <div className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</div>}
                                       {msg.content}
                                       <div className="text-[9px] opacity-50 text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                   </div>
                               </div>
                           )
                       })}
                       <div ref={messagesEndRef} />
                   </div>
                   
                   <div className="p-3 bg-dark-card border-t border-white/5 flex gap-2">
                       <input 
                           className="flex-1 bg-dark-bg border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-brand-500" 
                           placeholder="Ketik pesan..."
                           value={inputText}
                           onChange={e => setInputText(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSend()}
                       />
                       <button onClick={handleSend} className="bg-brand-600 p-2 rounded-xl text-white"><Send size={20}/></button>
                   </div>
              </div>
          </div>
      </div>
  );
};

export default Chat;
