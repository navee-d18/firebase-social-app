import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, orderBy, serverTimestamp, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiSend, FiArrowLeft, FiUsers, FiInfo, FiTrash2, FiBell, FiShield, FiLock, FiGlobe, FiCalendar } from 'react-icons/fi';
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
  const [showInfo, setShowInfo] = useState(false);
  const [adminName, setAdminName] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;

    // Fetch Group Details
    const fetchGroup = async () => {
      const docSnap = await getDoc(doc(db, 'groups', groupId));
      if (docSnap.exists()) {
        setGroup({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Group not found");
        navigate('/community');
      }
    };

    // Fetch Messages
    const q = query(collection(db, `groups/${groupId}/messages`), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    fetchGroup();
    return unsub;
  }, [groupId]);

  useEffect(() => {
    const fetchAdminName = async () => {
      if (!group?.ownerId) return;
      if (group.ownerId === currentUser.uid) {
        setAdminName('You');
        return;
      }
      try {
        const adminDoc = await getDoc(doc(db, 'users', group.ownerId));
        if (adminDoc.exists()) {
          setAdminName(`@${adminDoc.data().username}`);
        } else {
          setAdminName('Community Mod');
        }
      } catch (err) {
        setAdminName('Community Mod');
      }
    };
    if (showInfo) fetchAdminName();
  }, [group, showInfo, currentUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, `groups/${groupId}/messages`), {
        text: msgText,
        senderId: currentUser.uid,
        senderName: userData?.username || 'User',
        senderPhoto: userData?.photoURL || '',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'groups', groupId), {
        lastMessage: `${userData?.username}: ${msgText}`,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, `groups/${groupId}/messages`, msgId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const isAdmin = group?.ownerId === currentUser.uid;

  return (
    <div className="flex h-full glass dark:glass-dark rounded-2xl overflow-hidden border border-border/50" style={{ height: '85vh' }}>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface/30">
        {/* Header */}
        <div className="h-16 border-b border-border/50 flex items-center justify-between px-4 bg-surface/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link to="/community" className="p-2 hover:bg-secondary/10 rounded-full text-text-muted">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h3 className="font-bold flex items-center gap-2">
                {group?.name} {group?.type === 'private' && <FiShield className="text-primary w-3 h-3" />}
              </h3>
              <p className="text-[10px] text-text-muted">{group?.members?.length} members</p>
            </div>
          </div>
          <button onClick={() => setShowInfo(!showInfo)} className="p-2 hover:bg-secondary/10 rounded-full text-text-muted">
            <FiInfo className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, i) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden border border-border/50 mt-1">
                      {msg.senderPhoto ? <img src={msg.senderPhoto} className="w-full h-full object-cover" alt="" /> : msg.senderName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col group">
                    {!isMe && <span className="text-[10px] text-text-muted ml-2 mb-1">@{msg.senderName}</span>}
                    <div className={`px-4 py-2 rounded-2xl relative ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface border border-border/50 rounded-tl-none shadow-sm'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className="flex items-center justify-between gap-4 mt-1">
                        <span className="text-[9px] opacity-60">
                          {msg.createdAt?.toMillis ? format(msg.createdAt.toMillis(), 'hh:mm a') : '...'}
                        </span>
                        {(isMe || isAdmin) && (
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-surface/50">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message in ${group?.name}...`}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary transition-all"
            />
            <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
              <FiSend />
            </button>
          </div>
        </form>
      </div>

      {/* Info Sidebar */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border/50 bg-surface flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight mb-1">{group?.name}</h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1">
                    {group?.type === 'private' ? <><FiLock /> Private Community</> : <><FiGlobe /> Public Community</>}
                  </p>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <label className="text-[10px] uppercase tracking-wider text-primary font-black">Group Bio</label>
                  <p className="text-sm text-text-main mt-1 leading-relaxed">{group?.description || 'No description provided for this group.'}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted flex items-center gap-2"><FiUsers size={14} /> Members</span>
                    <span className="font-bold">{group?.members?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted flex items-center gap-2"><FiCalendar size={14} /> Created</span>
                    <span className="font-bold">{group?.createdAt?.toMillis ? format(group?.createdAt.toMillis(), 'MMM d, yyyy') : 'Recently'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted flex items-center gap-2"><FiShield size={14} /> Admin</span>
                    <span className="font-bold text-primary">{adminName || 'Loading...'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted font-black mb-3 block">Member Highlights</label>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(5, group?.members?.length || 0))].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-surface border-2 border-background flex items-center justify-center text-[10px] font-bold overflow-hidden">
                        {group?.members?.[i] === currentUser.uid ? (userData?.photoURL ? <img src={userData.photoURL} alt="" /> : 'Me') : <FiUsers className="opacity-30" />}
                      </div>
                    ))}
                    {(group?.members?.length || 0) > 5 && (
                      <div className="w-8 h-8 rounded-full bg-secondary text-white border-2 border-background flex items-center justify-center text-[10px] font-bold">
                        +{(group?.members?.length || 0) - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/50">
              <button 
                onClick={() => setShowInfo(false)}
                className="w-full py-3 bg-secondary/10 hover:bg-secondary/20 text-text-main rounded-xl font-bold transition-all text-sm"
              >
                Close Info
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GroupChat;
