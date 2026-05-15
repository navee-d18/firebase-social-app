import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { auth, db } from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FiGrid, FiArchive, FiTrash2, FiUser, FiMoon, FiSun, FiLogOut, FiX, FiUsers, FiMessageCircle, FiBell, FiHeart, FiActivity, FiCheckSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { currentUser, userData, unreadCount, unreadChatsCount } = useAuth();
  const { theme, cycleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), { isOnline: false }, { merge: true });
      }
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const navItems = [
    { name: 'Feed', path: '/feed', icon: <FiActivity /> },
    { name: 'Tasks', path: '/tasks', icon: <FiCheckSquare /> },
    { name: 'Dashboard', path: '/', icon: <FiGrid /> },
    { name: 'Community', path: '/community', icon: <FiUsers /> },
    { name: 'Friends', path: '/friends', icon: <FiHeart /> },
    { name: 'Chats', path: '/chat', icon: <FiMessageCircle />, badge: unreadChatsCount },
    { name: 'Notifications', path: '/notifications', icon: <FiBell />, badge: unreadCount },
    { name: 'Archive', path: '/archive', icon: <FiArchive /> },
    { name: 'Trash', path: '/trash', icon: <FiTrash2 /> },
    { name: 'Profile', path: '/profile', icon: <FiUser /> },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-surface border-r border-border transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            NotesApp
          </h2>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-secondary hover:text-text-main">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* User Profile Summary */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold overflow-hidden border-2 border-surface shadow-sm">
              {userData?.photoURL ? <img src={userData.photoURL} alt="" className="w-full h-full object-cover" /> : userData?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-main truncate">@{userData?.username || 'User'}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase tracking-wider">
                  Level {userData?.level || 1}
                </span>
              </div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-text-muted">
              <span>XP PROGRESS</span>
              <span>{userData?.xp || 0} / {Math.pow(userData?.level || 1, 2) * 100}</span>
            </div>
            <div className="h-1.5 w-full bg-surface border border-border/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((userData?.xp || 0) / (Math.pow(userData?.level || 1, 2) * 100)) * 100, 100)}%` }}
                className="h-full bg-gradient-to-r from-primary to-secondary"
              />
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-text-muted hover:bg-secondary/10 hover:text-text-main'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <button 
            onClick={cycleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 text-text-muted hover:bg-secondary/10 rounded-xl transition-all"
          >
            {theme === 'light' ? <FiSun /> : theme === 'dark' ? <FiMoon /> : <FiMoon className="text-gray-500" />}
            <span className="font-medium capitalize">Theme: {theme}</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-danger-color hover:bg-danger-color/10 rounded-xl transition-all"
          >
            <FiLogOut />
            <span className="font-medium text-[#ef4444]">Logout</span>
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
