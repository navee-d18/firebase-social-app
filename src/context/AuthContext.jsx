import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch extra user details from Firestore in realtime
        const docRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        });

        await setDoc(docRef, { isOnline: true }, { merge: true });

        // Listen for notifications
        const q = query(collection(db, 'notifications'), where('to', '==', user.uid));
        const unsubNotifs = onSnapshot(q, (snap) => {
          const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Manually sort since orderBy might need a composite index
          notifs.sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tB - tA;
          });
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => n.status === 'unread').length);
        });

        // Listen for unread chats
        const chatsQ = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
        const unsubChatsCount = onSnapshot(chatsQ, (snap) => {
          let cCount = 0;
          snap.docs.forEach(d => {
            const data = d.data();
            if (data.lastMessageSenderId && data.lastMessageSenderId !== user.uid && data.isLastMessageSeen === false) {
              cCount++;
            }
          });
          setUnreadChatsCount(cCount);
        });

        // Calculate clock skew (Server vs Client time)
        const calculateOffset = async () => {
          try {
            const tempRef = doc(collection(db, 'temp'), 'time');
            await setDoc(tempRef, { time: serverTimestamp() });
            const snap = await getDoc(tempRef);
            const serverTime = snap.data().time.toMillis();
            const clientTime = Date.now();
            setServerTimeOffset(serverTime - clientTime);
          } catch (e) {
            console.warn("Clock offset failed, using 0", e);
          }
        };
        calculateOffset();

        setLoading(false);
        return () => { unsubUser(); unsubNotifs(); unsubChatsCount(); };
      } else {
        setUserData(null);
        setNotifications([]);
        setUnreadCount(0);
        setUnreadChatsCount(0);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const updateXP = async (amount) => {
    if (!currentUser || !userData) return;
    try {
      const newXP = (userData.xp || 0) + amount;
      // Level logic: Level = floor(sqrt(XP / 100)) + 1
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        xp: newXP,
        level: newLevel
      }, { merge: true });
      
      if (newLevel > (userData.level || 1)) {
        toast.success(`LEVEL UP! You are now Level ${newLevel} 🏆`, {
          duration: 5000,
          icon: '🚀'
        });
      }
    } catch (err) {
      console.error("Error updating XP:", err);
    }
  };

  // Handle Online/Offline Heartbeat
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);

    const updateStatus = (status) => {
      setDoc(userRef, { 
        isOnline: status, 
        lastSeen: serverTimestamp() 
      }, { merge: true }).catch(e => console.error(e));
    };

    // Initial online
    updateStatus(true);

    // Heartbeat every 10 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      }
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      } else {
        // Set offline if tab hidden
        updateStatus(false);
      }
    };

    const handleUnload = () => {
      // This is a "best effort" attempt to set offline on tab close
      updateStatus(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      updateStatus(false);
    };
  }, [currentUser]);

  const value = {
    currentUser,
    userData,
    notifications,
    unreadCount,
    unreadChatsCount,
    updateXP,
    serverTimeOffset
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
