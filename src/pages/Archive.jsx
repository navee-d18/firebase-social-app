import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import NoteCard from '../components/notes/NoteCard';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiArchive } from 'react-icons/fi';

function Archive() {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notes'),
      where('uid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter locally to avoid index errors
      fetchedNotes = fetchedNotes.filter(n => n.isArchived === true && n.isTrashed !== true);
      setNotes(fetchedNotes);
      setLoading(false);
    }, (error) => {
      console.error("Archive fetch error:", error);
      toast.error(error.message || 'Failed to fetch archive');
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleUnarchive = async (id) => {
    try {
      await updateDoc(doc(db, 'notes', id), { isArchived: false });
      toast.success('Note unarchived');
    } catch (error) {
      toast.error('Failed to unarchive note');
    }
  };

  const handleMoveToTrash = async (id) => {
    try {
      await updateDoc(doc(db, 'notes', id), { isTrashed: true, isArchived: false });
      toast.success('Moved to trash');
    } catch (error) {
      toast.error('Failed to move to trash');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
          <FiArchive className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-text-main">Archive</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <FiArchive className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">Your archive is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {notes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                context="archive"
                onArchiveToggle={() => handleUnarchive(note.id)}
                onTrashToggle={() => handleMoveToTrash(note.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default Archive;
