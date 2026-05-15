import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, getDocs, where, serverTimestamp, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiMessageSquare, FiSearch, FiUserPlus, FiPlus, FiHash, FiShield, FiLock, FiGlobe } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Community() {
  const { currentUser, userData, serverTimeOffset } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('people'); // 'people' or 'groups'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // Fetch Users
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser.uid));
    });

    // Fetch Groups
    const qGroups = query(collection(db, 'groups'));
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubUsers(); unsubGroups(); };
  }, [currentUser]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        type: isPrivate ? 'private' : 'public',
        ownerId: currentUser.uid,
        members: [currentUser.uid],
        createdAt: serverTimestamp(),
        lastMessage: 'Group created',
        updatedAt: serverTimestamp()
      });
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDesc('');
      toast.success('Community Group Created!');
      navigate(`/group/${groupRef.id}`);
    } catch (err) {
      toast.error('Failed to create group');
    }
  };

  const handleJoinGroup = async (group) => {
    try {
      await updateDoc(doc(db, 'groups', group.id), {
        members: arrayUnion(currentUser.uid)
      });
      toast.success(`Joined ${group.name}!`);
      navigate(`/group/${group.id}`);
    } catch (err) {
      toast.error('Failed to join group');
    }
  };

  const handleStartChat = async (targetUser) => {
    try {
      // Check if chat already exists
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      let existingChatId = null;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(targetUser.id)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        navigate(`/chat/${existingChatId}`);
      } else {
        // Create new chat
        const newChat = await addDoc(chatsRef, {
          participants: [currentUser.uid, targetUser.id],
          participantData: {
            [currentUser.uid]: {
              username: userData?.username || currentUser.displayName || 'User',
              photoURL: userData?.photoURL || currentUser.photoURL || ''
            },
            [targetUser.id]: {
              username: targetUser.username,
              photoURL: targetUser.photoURL || ''
            }
          },
          updatedAt: new Date(),
          lastMessage: ''
        });
        navigate(`/chat/${newChat.id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to start chat');
    }
  };

  const handleSendRequest = async (targetUser) => {
    try {
      // Check if a request already exists
      const q = query(collection(db, 'notifications'), 
        where('from', '==', currentUser.uid), 
        where('to', '==', targetUser.id),
        where('type', '==', 'friend_request')
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        toast.error('Friend request already sent!');
        return;
      }

      await addDoc(collection(db, 'notifications'), {
        to: targetUser.id,
        from: currentUser.uid,
        fromName: userData?.username || currentUser.displayName || 'Someone',
        type: 'friend_request',
        status: 'unread',
        createdAt: serverTimestamp()
      });
      toast.success('Friend request sent!');
    } catch (err) {
      toast.error('Failed to send request');
    }
  };

  const isFriend = (userId) => {
    return userData?.friends?.includes(userId);
  };

  const isUserOnline = (user) => {
    if (!user.isOnline) return false;
    if (!user.lastSeen) return false; 
    const lastSeen = user.lastSeen.toMillis ? user.lastSeen.toMillis() : user.lastSeen;
    const nowServer = Date.now() + serverTimeOffset;
    const diff = nowServer - lastSeen;
    return diff < 60000; // 1 minute threshold (now accurate)
  };

  const getLastSeenText = (user) => {
    if (isUserOnline(user)) return 'Online';
    if (!user.lastSeen) return 'Offline';
    const lastSeen = user.lastSeen.toMillis ? user.lastSeen.toMillis() : user.lastSeen;
    const nowServer = Date.now() + serverTimeOffset;
    const diffMins = Math.floor((nowServer - lastSeen) / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return 'Recently';
  };

  const filteredUsers = users.filter(user =>  
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col max-w-5xl mx-auto w-full py-4"
    >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <FiUsers className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-text-main">Community</h1>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-surface/50 p-1 rounded-xl border border-border/50 w-fit">
            <button 
              onClick={() => setActiveTab('people')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'people' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
            >
              People
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'groups' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
            >
              Groups
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab === 'groups' && (
            <button 
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md"
            >
              <FiPlus /> Create Group
            </button>
          )}
          <div className="relative flex-1 md:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder={activeTab === 'people' ? "Search users..." : "Search groups..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface focus:border-primary outline-none transition-all shadow-sm"
            />
          </div>
        </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {activeTab === 'people' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.length === 0 ? (
                <p className="col-span-full text-center py-10 text-text-muted">No users found.</p>
              ) : (
                filteredUsers.map((user) => (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass dark:glass-dark p-5 rounded-2xl flex items-center justify-between border border-border/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-lg font-bold overflow-hidden border-2 border-surface">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            user.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${isUserOnline(user) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`}></span>
                      </div>
                      <div>
                        <h3 className="font-bold text-text-main">@{user.username}</h3>
                        <p className={`text-[10px] font-medium ${isUserOnline(user) ? 'text-green-500' : 'text-text-muted'}`}>
                          {getLastSeenText(user)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isFriend(user.id) ? (
                        <button 
                          onClick={() => handleSendRequest(user)}
                          className="p-3 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-xl transition-colors"
                          title="Send Friend Request"
                        >
                          <FiUserPlus />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStartChat(user)}
                          className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-colors"
                          title="Message Friend"
                        >
                          <FiMessageSquare />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <p className="col-span-full text-center py-10 text-text-muted">No groups found.</p>
              ) : (
                groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map((group) => (
                  <motion.div 
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass dark:glass-dark p-5 rounded-2xl flex flex-col border border-border/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <FiHash className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-surface rounded-md border border-border/50">
                        {group.type === 'private' ? <><FiLock className="w-3 h-3"/> Private</> : <><FiGlobe className="w-3 h-3"/> Public</>}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-text-main mb-1">{group.name}</h3>
                    <p className="text-sm text-text-muted mb-4 line-clamp-2 min-h-[40px]">{group.description || 'No description available.'}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <FiUsers className="w-3 h-3" /> {group.members?.length || 0} Members
                      </span>
                      {group.members?.includes(currentUser.uid) ? (
                        <button 
                          onClick={() => navigate(`/group/${group.id}`)}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
                        >
                          Enter Group
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleJoinGroup(group)}
                          className="px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-sm font-bold hover:bg-secondary hover:text-white transition-all"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FiPlus className="text-primary" /> Create Community
            </h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 ml-1 text-text-muted">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Developers Hub"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 ml-1 text-text-muted">Description</label>
                <textarea 
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="What is this community about?"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary transition-all h-24 resize-none"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <FiLock className="text-text-muted" />
                  <span className="text-sm font-bold">Private Community</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPrivate ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 py-3 bg-secondary/10 text-text-muted rounded-xl font-bold hover:bg-secondary/20 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default Community;
