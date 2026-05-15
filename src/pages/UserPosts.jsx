import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/feed/PostCard';
import { FiArrowLeft, FiUser, FiActivity } from 'react-icons/fi';

function UserPosts() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        }
      } catch (err) {
        console.error(err);
      }
    };

    const q = query(
      collection(db, 'posts'), 
      where('uid', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Manual sort
      fetchedPosts.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });
      setPosts(fetchedPosts);
      setLoading(false);
    });

    fetchUserData();
    return unsubscribe;
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto py-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-secondary/10 rounded-full transition-colors text-text-muted"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-text-main">
          {user ? `@${user.username}'s Posts` : 'User Posts'}
        </h1>
      </div>

      {/* Profile Info Card */}
      {user && (
        <div className="glass dark:glass-dark rounded-2xl p-6 mb-8 border border-border/50 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-surface shadow-lg">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              user.username?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-main">@{user.username}</h2>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-text-muted"><b className="text-text-main">{posts.length}</b> Posts</span>
              <span className="text-text-muted"><b className="text-text-main">{user.friends?.length || 0}</b> Friends</span>
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-10">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-text-muted mt-10">
            <FiActivity className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No posts yet from this user.</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

export default UserPosts;
