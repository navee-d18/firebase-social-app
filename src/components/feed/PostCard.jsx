import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../context/AuthContext';
import { FiHeart, FiMessageCircle, FiSend, FiTrash2 } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PostCard = ({ post }) => {
  const { currentUser, userData, updateXP } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const isLiked = post.likes?.includes(currentUser.uid);

  useEffect(() => {
    const q = query(collection(db, `posts/${post.id}/comments`), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [post.id]);

  const handleLike = async () => {
    const postRef = doc(db, 'posts', post.id);
    if (isLiked) {
      await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
      updateXP(1);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const text = newComment;
    setNewComment('');
    await addDoc(collection(db, `posts/${post.id}/comments`), {
      text,
      uid: currentUser.uid,
      username: userData?.username || 'User',
      photoURL: userData?.photoURL || '',
      createdAt: serverTimestamp()
    });
    updateXP(2);
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      toast.success("Post deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, `posts/${post.id}/comments`, commentId));
      toast.success("Comment deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass dark:glass-dark rounded-2xl p-5 mb-6 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/user/${post.uid}`} className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden border-2 border-surface hover:ring-2 ring-primary transition-all">
            {post.userPhotoURL ? <img src={post.userPhotoURL} alt="" className="w-full h-full object-cover" /> : post.username?.[0]?.toUpperCase()}
          </Link>
          <div>
            <Link to={`/user/${post.uid}`} className="font-bold text-text-main hover:text-primary transition-colors block">@{post.username}</Link>
            <p className="text-xs text-text-muted">{post.createdAt?.toMillis ? formatDistanceToNow(post.createdAt.toMillis(), {addSuffix: true}) : 'Just now'}</p>
          </div>
        </div>
        {post.uid === currentUser.uid && (
          <button 
            onClick={handleDeletePost} 
            className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
            title="Delete Post"
          >
            <FiTrash2 />
          </button>
        )}
      </div>
      <p className="mb-4 whitespace-pre-wrap text-text-main">{post.text}</p>
      {post.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-4 bg-black/10 border border-border/30">
          <img src={post.imageUrl} alt="Post" className="w-full max-h-[500px] object-cover" />
        </div>
      )}
      <div className="flex items-center gap-6 pt-4 border-t border-border/50 text-text-muted">
        <button onClick={handleLike} className={`flex items-center gap-2 hover:text-pink-500 transition-colors ${isLiked ? 'text-pink-500' : ''}`}>
          <FiHeart className={isLiked ? 'fill-current' : ''} /> {post.likes?.length || 0}
        </button>
        <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 transition-colors ${showComments ? 'text-primary' : 'hover:text-primary'}`}>
          <FiMessageCircle /> 
          <span className="font-medium">{comments.length}</span>
          <span className="text-sm">Comments</span>
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
              {comments.map(c => (
                <div key={c.id} className="flex items-start justify-between bg-surface/50 p-3 rounded-xl border border-border/30 group/comment">
                  <div className="flex gap-3">
                    <Link to={`/user/${c.uid}`} className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden shrink-0">
                      {c.photoURL ? <img src={c.photoURL} alt="" className="w-full h-full object-cover" /> : c.username?.[0]?.toUpperCase()}
                    </Link>
                    <div>
                      <Link to={`/user/${c.uid}`} className="font-bold text-sm text-text-main hover:text-primary block">@{c.username}</Link>
                      <p className="text-sm text-text-muted">{c.text}</p>
                    </div>
                  </div>
                  {c.uid === currentUser.uid && (
                    <button 
                      onClick={() => handleDeleteComment(c.id)}
                      className="p-1 text-text-muted hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 px-4 py-2 rounded-xl border border-border bg-surface focus:border-primary outline-none text-sm transition-colors" />
              <button type="submit" disabled={!newComment.trim()} className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"><FiSend /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default PostCard;
