import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/feed/PostCard';
import { FiImage, FiSend, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

function Feed() {
  const { currentUser, userData, updateXP } = useAuth();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Manual sort to avoid index requirements
      fetchedPosts.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });
      setPosts(fetchedPosts);
    });
    return unsub;
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    setLoading(true);
    try {
      let imageUrl = '';
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        // Using environment variables for Cloudinary
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload failed');
        imageUrl = data.secure_url;
      }

      await addDoc(collection(db, 'posts'), {
        uid: currentUser.uid,
        username: userData?.username || 'User',
        userPhotoURL: userData?.photoURL || '',
        text: text.trim(),
        imageUrl,
        likes: [],
        createdAt: serverTimestamp()
      });

      setText('');
      setImage(null);
      setImagePreview(null);
      toast.success('Posted successfully!');
      updateXP(10);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
          <FiActivity className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-text-main">Social Feed</h1>
      </div>

      <div className="glass dark:glass-dark rounded-2xl p-5 mb-8 border border-border/50 shadow-sm shrink-0">
        <form onSubmit={handlePost}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent resize-none outline-none text-text-main placeholder:text-text-muted mb-4"
            rows="3"
          />
          {imagePreview && (
            <div className="relative mb-4 rounded-xl overflow-hidden bg-black/10 border border-border/50">
              <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
              <button type="button" onClick={() => {setImage(null); setImagePreview(null)}} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">✕</button>
            </div>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <label className="cursor-pointer flex items-center gap-2 text-primary hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors font-medium">
              <FiImage /> <span>Add Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <button type="submit" disabled={loading || (!text.trim() && !image)} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-primary/90 transition-all shadow-md active:scale-95">
              {loading ? 'Posting...' : <><FiSend /> Post</>}
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-10 custom-scrollbar">
        {posts.length === 0 ? (
          <div className="text-center text-text-muted mt-10">
            <FiActivity className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

export default Feed;
