import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, getDocs, where, serverTimestamp, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiMessageSquare, FiSearch, FiUserPlus, FiPlus, FiHash, FiShield, FiLock, FiGlobe, FiActivity, FiZap, FiTarget } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Community() {
  const { currentUser, userData, serverTimeOffset } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'my-groups', 'people'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser.uid));
    });

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
        lastMessage: 'Nexus Community initialized',
        updatedAt: serverTimestamp(),
        category: 'General'
      });
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDesc('');
      toast.success('Community Core Online!');
      navigate(`/group/${groupRef.id}`);
    } catch (err) {
      toast.error('Initialization failed');
    }
  };

  const isUserOnline = (user) => {
    if (!user.isOnline || !user.lastSeen) return false;
    const lastSeen = user.lastSeen.toMillis ? user.lastSeen.toMillis() : user.lastSeen;
    const nowServer = Date.now() + serverTimeOffset;
    return (nowServer - lastSeen) < 60000;
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card bg-gradient-to-r from-primary/10 via-surface to-secondary/10 border-white/5"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/20 rounded-2xl text-primary shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <FiUsers className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Nexus Communities</h1>
              <p className="text-text-muted text-sm tracking-wide">Connect, Collaborate, Conquer.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search Nexus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none focus:border-primary/50 transition-all text-sm"
              />
            </div>
            <button 
              onClick={() => setShowCreateGroup(true)}
              className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <FiPlus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Hub Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        
        {/* Left Column: Navigation/Stats */}
        <div className="w-full md:w-64 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div className="premium-card p-4 space-y-2">
            {[
              { id: 'explore', label: 'Explore Hub', icon: <FiGlobe /> },
              { id: 'my-groups', label: 'My Nexus', icon: <FiTarget /> },
              { id: 'people', label: 'Citizens', icon: <FiUserPlus /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5'
                }`}
              >
                {tab.icon} <span className="font-bold text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="premium-card p-4">
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Active Nexus</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Total Groups</span>
                <span className="text-white font-mono">{groups.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Active Now</span>
                <span className="text-green-400 font-mono">{users.filter(isUserOnline).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Discovery/Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {activeTab === 'explore' || activeTab === 'my-groups' ? (
                  filteredGroups
                    .filter(g => activeTab === 'explore' || g.members?.includes(currentUser.uid))
                    .map((group) => (
                    <motion.div
                      key={group.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -5 }}
                      className="premium-card bg-surface/50 border-white/5 flex flex-col group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl text-primary border border-white/5 shadow-inner">
                          <FiHash className="w-6 h-6" />
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 ${
                          group.type === 'private' ? 'text-secondary bg-secondary/10' : 'text-primary bg-primary/10'
                        }`}>
                          {group.type}
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-primary transition-colors">{group.name}</h3>
                      <p className="text-sm text-text-muted line-clamp-2 mb-6 h-10">{group.description}</p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(3, group.members?.length || 0))].map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-surface border border-background flex items-center justify-center text-[8px] font-bold">
                                {i + 1}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-text-muted font-bold">{group.members?.length} Members</span>
                        </div>
                        
                        <button 
                          onClick={() => navigate(`/group/${group.id}`)}
                          className="px-4 py-2 bg-white/5 hover:bg-primary text-white text-xs font-black rounded-xl transition-all"
                        >
                          {group.members?.includes(currentUser.uid) ? 'ENTER' : 'JOIN'}
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  users.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <motion.div
                      key={user.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="premium-card flex items-center justify-between gap-4 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-surface border border-white/10 flex items-center justify-center font-bold text-lg overflow-hidden">
                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : user.username?.[0].toUpperCase()}
                          </div>
                          {isUserOnline(user) && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">@{user.username}</h4>
                          <p className="text-[10px] text-text-muted tracking-widest uppercase font-black">Citizen</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/user/${user.id}`)}
                        className="p-3 bg-white/5 hover:bg-secondary/20 text-secondary rounded-xl transition-all"
                      >
                        <FiMessageSquare />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Futuristic Modal: Create Group */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="premium-card w-full max-w-md bg-surface p-8 border-primary/20 shadow-[0_0_50px_rgba(79,70,229,0.2)]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <FiZap className="text-primary" /> NEW NEXUS
                </h2>
                <button onClick={() => setShowCreateGroup(false)} className="text-text-muted hover:text-white transition-colors">
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Community Identifier</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nexus One"
                    className="w-full px-5 py-4 rounded-2xl bg-black/30 border border-white/5 outline-none focus:border-primary transition-all text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Mission Objective</label>
                  <textarea 
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Brief mission description..."
                    className="w-full px-5 py-4 rounded-2xl bg-black/30 border border-white/5 outline-none focus:border-primary transition-all h-28 resize-none text-white text-sm"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <FiLock className="text-primary" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">PRIVATE MISSION</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      animate={{ x: isPrivate ? 26 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  INITIALIZE
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FiX = ({ className, onClick }) => (
  <svg onClick={onClick} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default Community;
