import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiCpu, FiTrendingUp, FiTarget, FiZap, FiActivity } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ notes: 0, xp: 1250, streak: 5 });
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulated fetching recent notes
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'notes'),
      where('uid', '==', currentUser.uid),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentNotes(fetchedNotes);
      setStats(prev => ({ ...prev, notes: fetchedNotes.length * 12 })); // Mock stat calculation
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className="min-h-full flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section with Neon Glow */}
      <motion.div variants={itemVariants} className="relative overflow-hidden premium-card bg-gradient-to-br from-primary/20 to-secondary/10 border-primary/30">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/30 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/30 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-glow mb-2">
              Welcome back, {currentUser?.displayName || 'Traveler'}
            </h1>
            <p className="text-text-muted text-lg">Your AI-powered productivity nexus is ready.</p>
          </div>
          
          {/* Quick AI Launch */}
          <Link to="/chat" className="group relative px-6 py-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl text-primary">
                <FiCpu className="w-5 h-5 animate-pulse" />
              </div>
              <span className="font-semibold tracking-wide">Ask AI Assistant</span>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Current XP", value: stats.xp, icon: <FiTrendingUp />, color: "text-green-400", bg: "bg-green-400/10" },
          { title: "Active Streak", value: `${stats.streak} Days`, icon: <FiZap />, color: "text-yellow-400", bg: "bg-yellow-400/10" },
          { title: "Total Notes", value: stats.notes, icon: <FiMessageSquare />, color: "text-primary", bg: "bg-primary/10" }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="premium-card flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              {React.cloneElement(stat.icon, { className: 'w-6 h-6' })}
            </div>
            <div>
              <p className="text-text-muted text-sm uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Main Feed / Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2 premium-card flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FiActivity className="text-primary" /> Community Pulse
            </h2>
            <Link to="/community" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/50 rounded-2xl bg-surface/30 backdrop-blur-sm">
            <div className="text-center text-text-muted">
              <p className="mb-2">Real-time community feed will appear here.</p>
              <span className="text-xs uppercase tracking-widest text-primary/70">Connecting to Firebase OnSnapshot...</span>
            </div>
          </div>
        </motion.div>

        {/* AI Suggestions & Productivity */}
        <motion.div variants={itemVariants} className="premium-card flex flex-col bg-gradient-to-b from-surface to-surface-hover/50">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <FiTarget className="text-secondary" /> AI Suggestions
          </h2>
          <div className="space-y-4">
            {[
              "Review your pinned note from yesterday.",
              "You have 3 unchecked daily goals.",
              "Study group 'React Masters' is active now."
            ].map((text, i) => (
              <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5 hover:border-secondary/30 transition-colors cursor-pointer group">
                <p className="text-sm text-text-main group-hover:text-secondary transition-colors">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-6">
            <button className="w-full py-3 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-white transition-all">
              Generate Focus Plan
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
