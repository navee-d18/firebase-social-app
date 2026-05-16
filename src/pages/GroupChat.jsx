import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, orderBy, serverTimestamp, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiSend, FiArrowLeft, FiUsers, FiInfo, FiTrash2, FiBell, FiShield, FiLock, FiGlobe, FiCalendar, FiHash, FiMoreVertical, FiCpu, FiPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function GroupChat() {
  const { currentUser, userData } = useAuth();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [activeChannel, setActiveChannel] = useState('general');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;

    const unsubGroup = onSnapshot(doc(db, 'groups', groupId), (docSnap) => {
      if (docSnap.exists()) {
        setGroup({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Nexus Disconnected");
        navigate('/community');
      }
    });

    const q = query(collection(db, `groups/${groupId}/messages`), orderBy('createdAt', 'asc'));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => { unsubGroup(); unsubMessages(); };
  }, [groupId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, `groups/${groupId}/messages`), {
        text: msgText,
        senderId: currentUser.uid,
        senderName: userData?.username || 'Citizen',
        senderPhoto: userData?.photoURL || '',
        createdAt: serverTimestamp(),
        channel: activeChannel
      });

      await updateDoc(doc(db, 'groups', groupId), {
        lastMessage: `${userData?.username}: ${msgText}`,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      toast.error("Transmission failed");
    }
  };

  const isAdmin = group?.ownerId === currentUser.uid;

  const channels = [
    { id: 'general', name: 'general-chat', icon: <FiHash /> },
    { id: 'announcements', name: 'announcements', icon: <FiBell /> },
    { id: 'resources', name: 'resource-hub', icon: <FiGlobe /> },
    { id: 'ai-help', name: 'ai-assistance', icon: <FiCpu /> },
  ];

  return (
    <div className="h-full flex rounded-3xl overflow-hidden glass-dark border border-white/10 shadow-2xl relative">
      
      {/* Column 1: Discord-Style Channel List */}
      <div className="hidden lg:flex w-64 bg-black/40 border-r border-white/5 flex-col">
        <div className="p-6 border-b border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
          <h2 className="text-lg font-black text-white truncate flex items-center gap-2">
            {group?.name || 'Nexus Hub'}
          </h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Community Server</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div>
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 ml-2">Channels</h3>
            <div className="space-y-1">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    activeChannel === channel.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg opacity-70">{channel.icon}</span>
                  <span className="text-sm font-bold truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 ml-2">
              <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Voice Hubs</h3>
              <button className="text-primary hover:text-white"><FiPlus size={14}/></button>
            </div>
            <div className="space-y-1 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-[11px] text-text-muted font-bold text-center italic">
              No active voice pulses.
            </div>
          </div>
        </div>

        <div className="p-4 bg-black/20 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center font-bold text-xs overflow-hidden">
              {userData?.photoURL ? <img src={userData.photoURL} alt="" /> : userData?.username?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">@{userData?.username}</p>
              <p className="text-[8px] text-green-400 font-black uppercase tracking-tighter">Active Citizen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        {/* Header */}
        <div className="h-[76px] px-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <Link to="/community" className="lg:hidden p-2 -ml-2 text-text-muted hover:bg-white/10 rounded-full">
              <FiArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl text-primary">
                <FiHash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-tight">{activeChannel}</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Global Feed</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`p-3 rounded-xl transition-all ${showMembers ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-white/5'}`}
            >
              <FiUsers className="w-5 h-5" />
            </button>
            <button className="p-3 text-text-muted hover:text-white rounded-xl hover:bg-white/5 transition-all"><FiMoreVertical /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar relative">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-30">
                <FiMessageSquare className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No transmissions in {activeChannel}</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={msg.id || i} 
                    className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-xs font-bold overflow-hidden shadow-lg">
                        {msg.senderPhoto ? <img src={msg.senderPhoto} className="w-full h-full object-cover" alt="" /> : msg.senderName?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">@{msg.senderName}</span>
                        <span className="text-[9px] text-text-muted">
                          {msg.createdAt?.toMillis ? format(msg.createdAt.toMillis(), 'hh:mm a') : 'Now'}
                        </span>
                      </div>
                      <div className={`px-5 py-3 rounded-2xl relative shadow-xl ${
                        isMe 
                          ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none' 
                          : 'bg-surface/80 backdrop-blur-md border border-white/5 text-gray-100 rounded-tl-none'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-6 bg-black/20 backdrop-blur-xl border-t border-white/5">
          <div className="relative flex items-center gap-3 max-w-5xl mx-auto">
            <div className="flex-1 bg-surface/50 border border-white/10 rounded-2xl flex items-center px-4 py-1.5 focus-within:border-primary/50 transition-all shadow-inner">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Transmission to #${activeChannel}...`}
                className="flex-1 bg-transparent px-3 py-3 outline-none text-white text-sm placeholder:text-text-muted/50"
              />
            </div>
            <button 
              type="submit" 
              disabled={!newMessage.trim()} 
              className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Column 3: Member List (Toggleable) */}
      <AnimatePresence>
        {showMembers && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden xl:flex flex-col bg-black/40 border-l border-white/5 overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 bg-gradient-to-bl from-secondary/5 to-transparent">
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">Nexus Intel</h3>
              <p className="text-sm font-bold text-white truncate">Member Registry</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              <section>
                <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mb-4">Administrators — 1</h4>
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-primary/30 flex items-center justify-center text-[10px] font-black text-primary">
                    {isAdmin ? 'ME' : 'AD'}
                  </div>
                  <span className="text-xs font-bold text-primary truncate">Nexus Architect</span>
                </div>
              </section>

              <section>
                <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mb-4">Online Citizens — {group?.members?.length || 0}</h4>
                <div className="space-y-2">
                  {group?.members?.map((memberId, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center text-[10px] font-bold">
                          {memberId === currentUser.uid ? (userData?.photoURL ? <img src={userData.photoURL} alt=""/> : 'ME') : 'ID'}
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                      </div>
                      <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors truncate italic">
                        {memberId === currentUser.uid ? `@${userData?.username}` : 'Searching Hub...'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-white/5">
              <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2 flex items-center gap-2"><FiInfo size={12}/> Mission Info</p>
                <p className="text-[11px] text-text-muted leading-relaxed italic line-clamp-3">{group?.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

const FiMessageSquare = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

export default GroupChat;
