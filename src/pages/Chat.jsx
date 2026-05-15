import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { FiSend, FiArrowLeft, FiMessageCircle, FiTrash2, FiEdit3, FiSmile, FiCheck, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';

const formatTime = (timestamp) => {
  if (!timestamp || typeof timestamp.toMillis !== 'function') return '';
  const date = new Date(timestamp.toMillis());
  if (isToday(date)) return format(date, 'hh:mm a');
  if (isYesterday(date)) return `Yesterday, ${format(date, 'hh:mm a')}`;
  return format(date, 'MMM d, hh:mm a');
};

const formatShortTime = (timestamp) => {
  if (!timestamp || typeof timestamp.toMillis !== 'function') return '';
  const date = new Date(timestamp.toMillis());
  if (isToday(date)) return format(date, 'hh:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd/MM/yy');
};

function Chat() {
  const { currentUser } = useAuth();
  const { chatId } = useParams();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch chat list
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually since orderBy might require index
      fetchedChats.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return timeB - timeA;
      });
      setChats(fetchedChats);
    });
    return unsubscribe;
  }, [currentUser]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
      setTimeout(() => scrollToBottom(), 100);

      // Mark unread messages from other user as seen
      let markedAny = false;
      fetchedMessages.forEach(msg => {
        if (msg.senderId !== currentUser.uid && !msg.isSeen) {
          updateDoc(doc(db, `chats/${chatId}/messages`, msg.id), { isSeen: true }).catch(err => console.log(err));
          markedAny = true;
        }
      });
      
      if (markedAny) {
        updateDoc(doc(db, 'chats', chatId), { isLastMessageSeen: true }).catch(e => console.log(e));
      }
    });
    
    // Find active chat data
    const chat = chats.find(c => c.id === chatId);
    if (chat) setActiveChat(chat);

    return unsubscribe;
  }, [chatId, chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        isLastMessageSeen: false,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleEditMessage = async (msgId) => {
    if (!editText.trim()) return;
    try {
      await updateDoc(doc(db, `chats/${chatId}/messages`, msgId), {
        text: editText.trim(),
        isEdited: true
      });
      setEditingMessage(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, `chats/${chatId}/messages`, msgId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleAddReaction = async (msgId, emoji, currentReactions = {}) => {
    try {
      const reactions = { ...currentReactions };
      if (!reactions[emoji]) reactions[emoji] = [];
      
      if (reactions[emoji].includes(currentUser.uid)) {
        reactions[emoji] = reactions[emoji].filter(uid => uid !== currentUser.uid);
      } else {
        reactions[emoji].push(currentUser.uid);
      }
      
      await updateDoc(doc(db, `chats/${chatId}/messages`, msgId), { reactions });
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  const handleTyping = () => {
    if (!chatId) return;
    if (!typing) {
      setTyping(true);
      updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: false });
    }, 3000);
  };

  const getOtherUser = (chat) => {
    const otherId = chat.participants.find(id => id !== currentUser.uid);
    return chat.participantData?.[otherId] || { username: 'Unknown' };
  };

  const otherUserTyping = activeChat?.typing?.[activeChat.participants.find(id => id !== currentUser.uid)];

  return (
    <div className="flex glass dark:glass-dark rounded-2xl overflow-hidden border border-border/50" style={{ height: '85vh' }}>
      
      {/* Sidebar: Chats List */}
      <div className={`w-full md:w-80 border-r border-border/50 flex flex-col ${chatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiMessageCircle className="text-primary" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-text-muted mt-10">
              No active chats yet.<br/><Link to="/community" className="text-primary hover:underline">Find people in Community</Link>
            </div>
          ) : (
            chats.map(chat => {
              const otherUser = getOtherUser(chat);
              return (
                <Link 
                  key={chat.id} 
                  to={`/chat/${chat.id}`}
                  className={`flex items-center gap-3 p-4 border-b border-border/30 hover:bg-surface/50 transition-colors ${chatId === chat.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {otherUser.photoURL ? (
                      <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      otherUser.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-text-main truncate">@{otherUser.username}</h4>
                      <div className="flex items-center gap-2">
                        {chat.lastMessageSenderId !== currentUser.uid && chat.isLastMessageSeen === false && (
                          <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                        )}
                        <span className="text-xs text-text-muted">{formatShortTime(chat.updatedAt)}</span>
                      </div>
                    </div>
                    <p className={`text-sm truncate ${chat.lastMessageSenderId !== currentUser.uid && chat.isLastMessageSeen === false ? 'text-text-main font-bold' : 'text-text-muted'}`}>
                      {chat.lastMessage || 'New Chat'}
                    </p>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-surface/30 ${!chatId ? 'hidden md:flex' : 'flex'}`}>
        {!chatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <FiMessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Select a chat to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border/50 flex items-center px-4 bg-surface/50 backdrop-blur-md">
              <Link to="/chat" className="md:hidden mr-4 p-2 -ml-2 text-text-muted hover:bg-secondary/10 rounded-full">
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              {activeChat && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden">
                    {getOtherUser(activeChat).photoURL ? (
                      <img src={getOtherUser(activeChat).photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getOtherUser(activeChat).username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold">@{getOtherUser(activeChat).username}</h3>
                    {otherUserTyping && <span className="text-[10px] text-primary animate-pulse font-medium">typing...</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === currentUser.uid;
                const timeStr = formatTime(msg.createdAt);
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id || i} 
                    className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex flex-col gap-1 max-w-[75%] relative">
                      {/* Message Bubble */}
                      <div className={`px-4 py-2.5 rounded-2xl relative ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-surface border border-border/50 rounded-bl-none shadow-sm'}`}>
                        {editingMessage === msg.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <textarea 
                              className="w-full bg-transparent border-b border-white/30 focus:border-white outline-none resize-none"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows="2"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingMessage(null)} className="p-1 hover:bg-white/20 rounded"><FiX /></button>
                              <button onClick={() => handleEditMessage(msg.id)} className="p-1 hover:bg-white/20 rounded"><FiCheck /></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            {msg.isEdited && <span className="text-[9px] opacity-60 italic block mt-1">(edited)</span>}
                          </>
                        )}
                        
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-white/80' : 'text-text-muted'}`}>
                          <span>{timeStr}</span>
                          {isMe && (
                            <span className={msg.isSeen ? "text-blue-300 font-bold" : "text-white/60"}>
                              {msg.isSeen ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>

                        {/* Reactions Badge */}
                        {msg.reactions && Object.values(msg.reactions).some(uids => uids.length > 0) && (
                          <div className={`absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'} flex gap-1`}>
                            {Object.entries(msg.reactions).map(([emoji, uids]) => uids.length > 0 && (
                              <button 
                                key={emoji}
                                onClick={() => handleAddReaction(msg.id, emoji, msg.reactions)}
                                className={`bg-surface border border-border/50 rounded-full px-1.5 py-0.5 text-xs shadow-sm hover:scale-110 transition-transform ${uids.includes(currentUser.uid) ? 'border-primary ring-1 ring-primary/30' : ''}`}
                              >
                                {emoji} <span className="text-[10px] opacity-70">{uids.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Hover Actions */}
                      <div className={`absolute top-0 -translate-y-full flex gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'right-0' : 'left-0'}`}>
                        <button 
                          onClick={() => handleAddReaction(msg.id, '❤️', msg.reactions)}
                          className="p-1.5 glass dark:glass-dark rounded-full hover:bg-pink-500/10 hover:text-pink-500 text-xs"
                        >❤️</button>
                        <button 
                          onClick={() => handleAddReaction(msg.id, '👍', msg.reactions)}
                          className="p-1.5 glass dark:glass-dark rounded-full hover:bg-blue-500/10 hover:text-blue-500 text-xs"
                        >👍</button>
                        <button 
                          onClick={() => handleAddReaction(msg.id, '😂', msg.reactions)}
                          className="p-1.5 glass dark:glass-dark rounded-full hover:bg-yellow-500/10 hover:text-yellow-500 text-xs"
                        >😂</button>
                        {isMe && (
                          <>
                            <button 
                              onClick={() => { setEditingMessage(msg.id); setEditText(msg.text); }}
                              className="p-1.5 glass dark:glass-dark rounded-full hover:bg-primary/10 hover:text-primary text-xs"
                            ><FiEdit3 /></button>
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 glass dark:glass-dark rounded-full hover:bg-red-500/10 hover:text-red-500 text-xs"
                            ><FiTrash2 /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-surface/50 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface focus:border-primary outline-none transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
