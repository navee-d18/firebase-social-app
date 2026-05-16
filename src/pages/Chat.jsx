import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { FiSend, FiArrowLeft, FiMessageCircle, FiTrash2, FiEdit3, FiSmile, FiPaperclip, FiMic, FiImage, FiMoreVertical, FiCpu, FiCheck, FiVideo, FiPhone, FiCheckCircle, FiSearch, FiCamera, FiHeart } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

const formatTime = (timestamp) => {
  if (!timestamp || typeof timestamp.toMillis !== 'function') return '';
  const date = new Date(timestamp.toMillis());
  return format(date, 'hh:mm a');
};

function Chat() {
  const { currentUser } = useAuth();
  const { chatId } = useParams();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedChats.sort((a, b) => (b.updatedAt?.toMillis || 0) - (a.updatedAt?.toMillis || 0));
      setChats(fetchedChats);
    });
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      fetchedMessages.forEach(msg => {
        if (msg.senderId !== currentUser.uid && !msg.isSeen) {
          updateDoc(doc(db, `chats/${chatId}/messages`, msg.id), { isSeen: true }).catch(err => console.log(err));
        }
      });
    });
    
    const chat = chats.find(c => c.id === chatId);
    if (chat) setActiveChat(chat);
    return unsubscribe;
  }, [chatId, chats]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;
    const msgText = newMessage.trim();
    setNewMessage('');
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: msgText,
        senderId: currentUser.uid,
        isSeen: false,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: msgText,
        lastMessageSenderId: currentUser.uid,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      toast.error('Transmission failed');
    }
  };

  const getOtherUser = (chat) => {
    const otherId = chat.participants.find(id => id !== currentUser.uid);
    return chat.participantData?.[otherId] || { username: 'Citizen' };
  };

  return (
    <div className="h-full flex rounded-3xl overflow-hidden glass border border-white/5 shadow-2xl bg-[#000000]">
      
      {/* Sidebar: Instagram Style List */}
      <div className={`w-full md:w-[350px] bg-black border-r border-white/10 flex flex-col ${chatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">Messages</h2>
            <button className="text-white hover:opacity-70 transition-opacity"><FiEdit3 size={24}/></button>
          </div>
          <div className="relative mb-4">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search transmissions..." 
              className="w-full bg-[#121212] rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-white/20 outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* AI Contact */}
          <div onClick={() => toast.success("AI Syncing...")} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 cursor-pointer transition-all">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <FiCpu className="text-white w-7 h-7" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm">Nexus Intelligence</h4>
              <p className="text-xs text-text-muted truncate">Always here to help...</p>
            </div>
          </div>

          <div className="px-6 py-2">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Recent Nodes</p>
          </div>

          {chats.map(chat => {
            const otherUser = getOtherUser(chat);
            const isUnread = chat.lastMessageSenderId !== currentUser.uid && chat.isLastMessageSeen === false;
            
            return (
              <Link 
                key={chat.id} 
                to={`/chat/${chat.id}`}
                className={`flex items-center gap-4 px-6 py-4 transition-all ${chatId === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 bg-[#121212]">
                    {otherUser.photoURL ? <img src={otherUser.photoURL} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold">{otherUser.username?.[0]}</div>}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className={`text-sm ${isUnread ? 'font-black text-white' : 'font-bold text-gray-300'}`}>@{otherUser.username}</h4>
                    <span className="text-[10px] text-text-muted">now</span>
                  </div>
                  <p className={`text-xs truncate ${isUnread ? 'text-white font-bold' : 'text-text-muted'}`}>
                    {chat.lastMessage || 'Open link'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area: Instagram / WhatsApp Hybrid */}
      <div className={`flex-1 flex flex-col relative bg-black ${!chatId ? 'hidden md:flex' : 'flex'}`}>
        {!chatId || !activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center mb-6">
              <FiMessageCircle size={40} className="text-white opacity-40" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Your Transmissions</h2>
            <p className="text-text-muted max-w-xs text-sm">Send private messages to a friend or the AI Nexus.</p>
          </div>
        ) : (
          <>
            {/* Header: Instagram Style */}
            <div className="h-[70px] px-6 flex justify-between items-center border-b border-white/10 bg-black/80 backdrop-blur-xl z-20">
              <div className="flex items-center gap-4">
                <Link to="/chat" className="md:hidden text-white"><FiArrowLeft size={24} /></Link>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-[#121212]">
                  {getOtherUser(activeChat).photoURL ? (
                    <img src={getOtherUser(activeChat).photoURL} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold">{getOtherUser(activeChat).username?.[0]}</div>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">@{getOtherUser(activeChat).username}</h3>
                  <p className="text-[10px] text-green-500 font-bold">Active now</p>
                </div>
              </div>
              <div className="flex gap-5 text-white opacity-90">
                <FiPhone size={22} className="cursor-pointer hover:opacity-60" />
                <FiVideo size={24} className="cursor-pointer hover:opacity-60" />
                <FiMoreVertical size={22} className="cursor-pointer hover:opacity-60" />
              </div>
            </div>

            {/* Messages Area: Clean & Pill Bubbles */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 custom-scrollbar bg-black relative">
              {/* Subtle background doodle effect could go here */}
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUser.uid;
                  const showAvatar = !isMe && (i === 0 || messages[i-1].senderId !== msg.senderId);
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={msg.id || i} 
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-0.5'}`}
                    >
                      {!isMe && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar && (
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#121212] border border-white/10">
                              {getOtherUser(activeChat).photoURL ? <img src={getOtherUser(activeChat).photoURL} className="w-full h-full object-cover" /> : <div className="text-[10px] flex items-center justify-center h-full font-bold">{getOtherUser(activeChat).username?.[0]}</div>}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={`max-w-[70%] group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-[22px] text-[15px] leading-snug ${
                          isMe 
                            ? 'bg-gradient-to-tr from-primary to-indigo-500 text-white shadow-md' 
                            : 'bg-[#262626] text-white border border-white/5'
                        } ${isMe ? 'rounded-tr-md' : 'rounded-tl-md'}`}>
                          {msg.text}
                        </div>
                        {i === messages.length - 1 && (
                          <div className="mt-1 flex items-center gap-1 opacity-40 text-[9px] font-bold text-white uppercase tracking-tighter">
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMe && <span>• Seen</span>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar: Instagram Style Pill */}
            <div className="p-4 bg-black">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                <div className="bg-[#121212] border border-white/10 rounded-[30px] flex items-center px-4 py-1.5 focus-within:border-white/20 transition-all">
                  <div className="p-2 bg-primary/20 rounded-full text-primary mr-2 cursor-pointer hover:bg-primary hover:text-white transition-all">
                    <FiCamera size={20} />
                  </div>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 bg-transparent px-3 py-3 outline-none text-white text-[14px] placeholder:text-text-muted"
                  />
                  {newMessage.trim() ? (
                    <button type="submit" className="text-primary font-black px-4 py-2 text-sm hover:opacity-80 transition-opacity">Send</button>
                  ) : (
                    <div className="flex items-center gap-4 text-white opacity-90 pr-2">
                      <FiMic size={20} className="cursor-pointer hover:opacity-60" />
                      <FiImage size={20} className="cursor-pointer hover:opacity-60" />
                      <FiHeart size={20} className="cursor-pointer hover:opacity-60" />
                    </div>
                  )}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
