import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import MobileHeader from './components/layout/MobileHeader';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Archive from './pages/Archive';
import Trash from './pages/Trash';
import Profile from './pages/Profile';
import Community from './pages/Community';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Friends from './pages/Friends';
import Feed from './pages/Feed';
import UserPosts from './pages/UserPosts';
import Tasks from './pages/Tasks';
import GroupChat from './pages/GroupChat';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

function App() {
  const { currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{ className: 'glass dark:glass-dark text-text-main' }} />
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to="/" />} />
          
          {/* Protected Routes wrapped in Layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex h-screen bg-bg-main text-text-main overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                  <div 
                    className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                )}

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
                  
                  <main className="flex-1 h-full overflow-y-auto p-4 lg:p-8 custom-scrollbar pt-20 lg:pt-8 pb-24 lg:pb-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/feed" element={<Feed />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/group/:groupId" element={<GroupChat />} />
                      <Route path="/user/:userId" element={<UserPosts />} />
                      <Route path="/archive" element={<Archive />} />
                      <Route path="/trash" element={<Trash />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/chat/:chatId" element={<Chat />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/friends" element={<Friends />} />
                    </Routes>
                  </main>
                  <BottomNav />
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </>
  );
}

export default App;
