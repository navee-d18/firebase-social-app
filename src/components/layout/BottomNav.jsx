import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiActivity, FiCheckSquare, FiUsers, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
  const { unreadChatsCount } = useAuth();

  const navItems = [
    { name: 'Feed', path: '/feed', icon: <FiActivity /> },
    { name: 'Tasks', path: '/tasks', icon: <FiCheckSquare /> },
    { name: 'Dashboard', path: '/', icon: <FiGrid /> },
    { name: 'Community', path: '/community', icon: <FiUsers /> },
    { name: 'Chats', path: '/chat', icon: <FiMessageCircle />, badge: unreadChatsCount },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-border/50 px-2 py-1 z-50 flex justify-around items-center pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 transition-all duration-300 relative ${
              isActive ? 'text-primary' : 'text-text-muted hover:text-text-main'
            }`
          }
        >
          <div className="text-xl relative">
            {item.icon}
            {item.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
          
          {/* Active Indicator Dot */}
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `absolute -bottom-1 w-1 h-1 rounded-full bg-primary transition-all duration-300 ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`
            }
          />
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
