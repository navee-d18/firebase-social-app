import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../utils/firebase';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiZap } from 'react-icons/fi';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateOnlineStatus = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { isOnline: true }, { merge: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await updateOnlineStatus(result.user);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      console.error(err.code);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setError('Email is wrong');
      } else if (err.code === 'auth/wrong-password') {
        setError('Password is wrong');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const randomNum = Math.floor(Math.random() * 10000);
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: `user_${randomNum}`,
          email: user.email,
          photoURL: user.photoURL || '',
          isOnline: true,
          createdAt: serverTimestamp()
        });
      } else {
        await updateOnlineStatus(user);
      }

      toast.success('Logged in with Google!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Google Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 mesh-gradient">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-5xl glass dark:glass-dark rounded-[40px] overflow-hidden premium-shadow min-h-[650px] border border-white/20"
      >
        {/* Left Side - Visual Card */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 bg-gradient-to-br from-black via-neutral-900 to-zinc-900 text-white relative overflow-hidden border-r border-amber-500/20">
          {/* Animated Background Gold Blobs */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute -top-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -bottom-20 -right-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"
          />

          <div className="relative z-10">
            <div className="w-12 h-12 bg-amber-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <FiZap className="text-2xl text-amber-500 fill-amber-500" />
            </div>
            <h1 className="text-5xl font-black leading-tight mb-6 tracking-tight text-white">
              Welcome Back,<br/>
              <span className="text-amber-500/80">Achiever.</span>
            </h1>
          </div>

          <div className="relative z-10">
            <p className="text-amber-500/60 text-sm font-bold uppercase tracking-widest mb-4">Elite Productivity</p>
            <h3 className="text-2xl font-bold leading-snug text-white/90">
              Access your dashboard anytime with secure, efficient account management.
            </h3>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-black">
          <div className="mb-10">
            <div className="lg:hidden flex justify-center mb-8">
               <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/20">
                 <FiZap />
               </div>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-2">Log in to your account</h2>
            <p className="text-neutral-400 font-medium">Sign in to access your personalized dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-500/70 uppercase tracking-widest ml-1">Your email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-2xl border border-neutral-800 bg-neutral-900 focus:bg-black focus:border-amber-500 outline-none transition-all duration-300 font-medium text-white"
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-amber-500/70 uppercase tracking-widest">Your password</label>
                <Link to="/reset" className="text-xs font-bold text-amber-500 hover:underline">Forgot?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-2xl border border-neutral-800 bg-neutral-900 focus:bg-black focus:border-amber-500 outline-none transition-all duration-300 font-medium text-white"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs font-bold ml-1 bg-red-500/10 py-2 px-4 rounded-lg border border-red-500/20"
              >
                {error}
              </motion.p>
            )}
            
            <motion.button 
              whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)" }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-lg transition-all disabled:opacity-70"
            >
              {loading ? 'Logging in...' : 'Get started'}
            </motion.button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-neutral-800"></div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">or continue with</span>
            <div className="flex-1 h-px bg-neutral-800"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-all font-bold text-white"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Google
            </button>
          </div>

          <p className="text-center mt-10 text-sm font-medium text-neutral-400">
            Don't have an account? <Link to="/signup" className="text-amber-500 hover:text-amber-400 transition-colors font-bold border-b-2 border-amber-500/20 pb-0.5 ml-1">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
