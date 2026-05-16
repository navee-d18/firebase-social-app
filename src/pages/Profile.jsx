import React, { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../utils/firebase';
import { doc, updateDoc, query, collection, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCamera, FiEdit3, FiGlobe, FiTwitter, FiInstagram, FiGithub, FiActivity, FiZap, FiAward, FiShare2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

function Profile() {
  const { currentUser, userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(userData?.username || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [links, setLinks] = useState(userData?.links || { twitter: '', instagram: '', github: '' });
  const [photoURL, setPhotoURL] = useState(userData?.photoURL || currentUser?.photoURL || '');
  const [bannerURL, setBannerURL] = useState(userData?.bannerURL || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formattedUsername = username.toLowerCase().replace(/\s+/g, '');
    if (formattedUsername.length < 3) return toast.error("Username too short");

    setLoading(true);
    try {
      if (formattedUsername !== userData?.username) {
        const q = query(collection(db, 'users'), where('username', '==', formattedUsername));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) throw new Error("Username already taken");
      }

      let url = photoURL;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        url = data.secure_url;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: formattedUsername,
        photoURL: url,
        bio: bio,
        links: links,
        updatedAt: new Date()
      });

      toast.success('Nexus Identity Updated!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
      
      {/* Premium Profile Header / Banner */}
      <div className="relative">
        <div className="h-48 md:h-64 rounded-3xl overflow-hidden bg-gradient-to-r from-primary/30 via-indigo-600/20 to-secondary/30 border border-white/10">
          {bannerURL ? (
            <img src={bannerURL} className="w-full h-full object-cover opacity-60" alt="banner" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-10">
              <FiZap className="w-48 h-48" />
            </div>
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute -bottom-16 left-8 flex flex-col md:flex-row items-end gap-6 w-[calc(100%-4rem)]">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-surface border-4 border-background overflow-hidden shadow-2xl">
              {photoURL ? (
                <img src={photoURL} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-black">
                  {userData?.username?.[0].toUpperCase()}
                </div>
              )}
            </div>
            {isEditing && (
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all rounded-3xl">
                <FiCamera className="text-white w-8 h-8" />
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white">@{userData?.username || 'user'}</h1>
              <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-black uppercase tracking-widest">
                Level {userData?.level || 1}
              </span>
            </div>
            <p className="text-text-muted text-sm max-w-lg mt-2 italic">
              {userData?.bio || "Nexus citizen since " + (userData?.createdAt?.toDate().getFullYear() || "2026")}
            </p>
          </div>

          <div className="flex gap-2 pb-4">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-3 bg-white/5 hover:bg-primary text-white rounded-2xl border border-white/10 transition-all flex items-center gap-2 font-bold"
            >
              <FiEdit3 /> {isEditing ? 'Cancel' : 'Edit Identity'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Socials */}
        <div className="space-y-6">
          
          {/* XP & Leveling Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="premium-card">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <FiZap /> Core Progress
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-text-muted">Current Level</span>
                <span className="text-2xl font-black text-white">{userData?.level || 1}</span>
              </div>
              <div className="h-3 w-full bg-black/20 rounded-full border border-white/5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((userData?.xp || 0) / (Math.pow(userData?.level || 1, 2) * 100)) * 100, 100)}%` }}
                  className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                />
              </div>
              <p className="text-[10px] text-center text-text-muted font-bold tracking-widest">
                {userData?.xp || 0} / {Math.pow(userData?.level || 1, 2) * 100} XP TO NEXT LEVEL
              </p>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="premium-card">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-4">Transmission Links</h3>
            <div className="space-y-4">
              {[
                { id: 'twitter', icon: <FiTwitter />, label: 'Twitter/X', color: 'text-blue-400' },
                { id: 'instagram', icon: <FiInstagram />, label: 'Instagram', color: 'text-pink-400' },
                { id: 'github', icon: <FiGithub />, label: 'GitHub', color: 'text-gray-100' }
              ].map(link => (
                <div key={link.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                  <span className={`text-xl ${link.color}`}>{link.icon}</span>
                  <span className="text-sm font-bold text-text-muted group-hover:text-white transition-colors">
                    {userData?.links?.[link.id] || "No link connected"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Middle Column: Badges & Bio Edit */}
        <div className="lg:col-span-2 space-y-6">
          
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form 
                key="edit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleUpdateProfile} 
                className="premium-card space-y-6 border-primary/30 shadow-[0_0_30px_rgba(79,70,229,0.1)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Username Identifier</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-black/30 border border-white/5 outline-none focus:border-primary transition-all text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Email Access (Private)</label>
                    <input type="text" value={currentUser?.email} disabled className="w-full px-5 py-4 rounded-2xl bg-black/50 border border-white/5 text-text-muted cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Biological Transmission (Bio)</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your role in the Nexus..."
                    className="w-full px-5 py-4 rounded-2xl bg-black/30 border border-white/5 outline-none focus:border-primary transition-all h-28 resize-none text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.keys(links).map(link => (
                    <div key={link} className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{link}</label>
                      <input 
                        type="text" 
                        value={links[link]}
                        onChange={(e) => setLinks({...links, [link]: e.target.value})}
                        placeholder={`@${link}_handle`}
                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/5 outline-none focus:border-primary text-white text-xs"
                      />
                    </div>
                  ))}
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {loading ? 'SYNCING DATA...' : 'SAVE IDENTITY'}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Badges Section */}
                <div className="premium-card">
                  <h3 className="text-xs font-black text-accent uppercase tracking-widest mb-6 flex items-center gap-2">
                    <FiAward /> Achieved Badges
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { icon: <FiZap />, label: 'Pioneer', sub: 'Early User', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
                      { icon: <FiActivity />, label: 'Active', sub: '7 Day Streak', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
                      { icon: <FiAward />, label: 'Sage', sub: 'Level 10+', color: 'bg-primary/10 text-primary border-primary/30' },
                      { icon: <FiGlobe />, label: 'Social', sub: '5+ Friends', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' }
                    ].map((badge, i) => (
                      <div key={i} className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 ${badge.color}`}>
                        <span className="text-2xl">{badge.icon}</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">{badge.label}</p>
                        <p className="text-[8px] opacity-60 font-bold">{badge.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="premium-card bg-gradient-to-br from-surface to-primary/5">
                    <h4 className="text-sm font-bold text-white mb-4">Productivity Pulse</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Tasks Completed</span>
                        <span className="font-mono text-primary font-bold">124</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Notes Synced</span>
                        <span className="font-mono text-secondary font-bold">42</span>
                      </div>
                    </div>
                  </div>
                  <div className="premium-card bg-gradient-to-br from-surface to-secondary/5">
                    <h4 className="text-sm font-bold text-white mb-4">Social Presence</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Total Followers</span>
                        <span className="font-mono text-pink-500 font-bold">89</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Community Rank</span>
                        <span className="font-mono text-indigo-400 font-bold">Elite</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Profile;
