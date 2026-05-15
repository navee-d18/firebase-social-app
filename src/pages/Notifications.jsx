import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/firebase';
import { doc, updateDoc, deleteDoc, arrayUnion, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { FiBell, FiCheck, FiX, FiUserPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

function Notifications() {
  const { currentUser, userData, notifications } = useAuth();

  const handleAccept = async (notification) => {
    try {
      // Add friend to both users' friends array
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const senderRef = doc(db, 'users', notification.from);
      
      await updateDoc(currentUserRef, {
        friends: arrayUnion(notification.from)
      });
      await updateDoc(senderRef, {
        friends: arrayUnion(currentUser.uid)
      });

      // Mark notification as read
      await updateDoc(doc(db, 'notifications', notification.id), {
        status: 'read'
      });

      // Send acceptance notification back
      await addDoc(collection(db, 'notifications'), {
        to: notification.from,
        from: currentUser.uid,
        fromName: userData?.username || currentUser.displayName || 'Someone',
        type: 'friend_accepted',
        status: 'unread',
        createdAt: serverTimestamp()
      });

      toast.success('Friend request accepted!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectOrDelete = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (err) {
      toast.error('Failed to remove notification');
    }
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (n.status === 'unread') {
        updateDoc(doc(db, 'notifications', n.id), { status: 'read' });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <FiBell className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-text-main">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-primary hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-text-muted mt-20">
            <FiBell className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={n.id}
                className={`glass dark:glass-dark p-5 rounded-2xl flex items-center justify-between border ${n.status === 'unread' ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-xl text-primary">
                    {n.type === 'friend_request' ? <FiUserPlus /> : <FiBell />}
                  </div>
                  <div>
                    <p className="text-text-main">
                      <span className="font-bold">{n.fromName}</span> 
                      {n.type === 'friend_request' ? ' sent you a friend request.' : ' accepted your friend request!'}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {n.createdAt?.toMillis ? formatDistanceToNow(n.createdAt.toMillis(), { addSuffix: true }) : 'Just now'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {n.type === 'friend_request' && n.status === 'unread' && (
                    <button 
                      onClick={() => handleAccept(n)}
                      className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors"
                      title="Accept"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleRejectOrDelete(n.id)}
                    className="p-2 bg-secondary/10 text-secondary hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                    title="Remove"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default Notifications;
