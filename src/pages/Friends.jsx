import React, { useState, useEffect } from 'react';
import { collection, query, documentId, getDocs, where, doc, updateDoc, arrayRemove, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiUserMinus, FiMessageSquare } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Friends() {
  const { currentUser, userData, serverTimeOffset } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData?.friends || userData.friends.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), where('friends', 'array-contains', currentUser.uid));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const friendList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriends(friendList);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to load friends');
      setLoading(false);
    });

    return unsub;
  }, [userData, currentUser]);

  const isUserOnline = (user) => {
    if (!user.isOnline) return false;
    if (!user.lastSeen) return false;
    const lastSeen = user.lastSeen.toMillis ? user.lastSeen.toMillis() : user.lastSeen;
    const nowServer = Date.now() + serverTimeOffset;
    return (nowServer - lastSeen) < 60000;
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

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayRemove(friendId)
      });
      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(currentUser.uid)
      });
      setFriends(prev => prev.filter(f => f.id !== friendId));
      toast.success('Friend removed');
    } catch (err) {
      toast.error('Error removing friend');
    }
  };

  const handleStartChat = async (targetUser) => {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      let existingChatId = null;
      querySnapshot.forEach(doc => {
        if (doc.data().participants.includes(targetUser.id)) existingChatId = doc.id;
      });

      if (existingChatId) {
        navigate(`/chat/${existingChatId}`);
      } else {
        const newChat = await addDoc(chatsRef, {
          participants: [currentUser.uid, targetUser.id],
          participantData: {
            [currentUser.uid]: {
              username: userData?.username || 'User',
              photoURL: userData?.photoURL || ''
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
      toast.error('Failed to start chat');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-5xl mx-auto py-8 h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-pink-500/10 rounded-xl text-pink-500">
          <FiUsers className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-text-main">My Friends</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : friends.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted mt-20">
          <FiUsers className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">You haven't added any friends yet.</p>
          <button onClick={() => navigate('/community')} className="mt-4 text-primary hover:underline">
            Find friends in Community
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <motion.div 
              key={friend.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass dark:glass-dark p-5 rounded-2xl flex items-center justify-between border border-border/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-lg font-bold overflow-hidden">
                    {friend.photoURL ? (
                      <img src={friend.photoURL} alt={friend.username} className="w-full h-full object-cover" />
                    ) : (
                      friend.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${isUserOnline(friend) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`}></span>
                </div>
                <div>
                  <h3 className="font-bold text-text-main">@{friend.username}</h3>
                  <p className={`text-[10px] font-medium ${isUserOnline(friend) ? 'text-green-500' : 'text-text-muted'}`}>
                    {getLastSeenText(friend)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleStartChat(friend)}
                  className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                  title="Message"
                >
                  <FiMessageSquare />
                </button>
                <button 
                  onClick={() => handleRemoveFriend(friend.id)}
                  className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                  title="Remove Friend"
                >
                  <FiUserMinus />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Friends;
