import { FiMenu, FiZap, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const MobileHeader = ({ onMenuClick }) => {
  const { currentUser, userData } = useAuth();

  const handleLogout = async () => {
    if (!window.confirm("Logout from NotesApp?")) return;
    try {
      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), { isOnline: false }, { merge: true });
      }
      await signOut(auth);
      toast.success('Logged out');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass border-b border-border/50 px-4 flex items-center justify-between z-40">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-secondary/10 rounded-xl transition-colors text-text-main"
        >
          <FiMenu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <FiZap size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">NotesApp</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={handleLogout}
          className="p-2 text-text-muted hover:text-red-500 transition-colors"
          title="Logout"
        >
          <FiLogOut size={20} />
        </button>
        <div className="w-9 h-9 rounded-full border-2 border-primary/20 p-0.5">
          <img 
            src={userData?.photoURL || `https://ui-avatars.com/api/?name=${userData?.username || 'User'}&background=random`} 
            alt="" 
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
