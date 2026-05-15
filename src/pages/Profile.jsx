import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../utils/firebase';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';

function Profile() {
  const { currentUser, userData } = useAuth();
  const [username, setUsername] = useState(userData?.username || '');
  const [photoURL, setPhotoURL] = useState(userData?.photoURL || currentUser?.photoURL || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const formattedUsername = username.toLowerCase().replace(/\s+/g, '');
    if (formattedUsername.length < 3) {
      return toast.error("Username must be at least 3 characters");
    }

    setLoading(true);

    try {
      // Check username uniqueness if changed
      if (formattedUsername !== userData?.username) {
        const q = query(collection(db, 'users'), where('username', '==', formattedUsername));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setLoading(false);
          return toast.error("Username is already taken");
        }
      }

      let url = photoURL;
      
      // Upload image to Cloudinary if a new file is selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload failed');
        url = data.secure_url;
      }

      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: formattedUsername,
        photoURL: url
      });

      // Update Firestore User Document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: formattedUsername,
        photoURL: url
      });

      setPhotoURL(url);
      setUsername(formattedUsername);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      // Preview image
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <FiUser className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-text-main">Your Profile</h1>
      </div>

      <div className="glass dark:glass-dark rounded-2xl p-8">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-surface shadow-lg">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userData?.username?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <FiCamera className="text-white w-6 h-6" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <p className="mt-4 text-sm text-text-muted">Click to change avatar</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Email (Cannot be changed)</label>
            <input 
              type="text" 
              value={currentUser?.email || ''} 
              disabled 
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface/30 text-text-muted cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Edit your username"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-70 mt-4"
          >
            {loading ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
