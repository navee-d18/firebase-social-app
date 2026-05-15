import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import NoteCard from '../components/notes/NoteCard';
import NoteModal from '../components/notes/NoteModal';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

function Dashboard() {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notes'),
      where('uid', '==', currentUser.uid)
      // orderBy is omitted initially to avoid requiring composite indexes for beginners, handled locally.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        let fetchedNotes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        fetchedNotes = fetchedNotes.filter(n => !n.isArchived && !n.isTrashed);

        fetchedNotes.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          
          // Safe fallback if toMillis doesn't exist
          const timeA = typeof a.updatedAt?.toMillis === 'function' ? a.updatedAt.toMillis() : 
                        (typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0);
          const timeB = typeof b.updatedAt?.toMillis === 'function' ? b.updatedAt.toMillis() : 
                        (typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0);
          
          return timeB - timeA;
        });

        setNotes(fetchedNotes);
        setLoading(false);
      } catch (err) {
        console.error("Error processing notes:", err);
        toast.error("Error loading notes format");
        setLoading(false);
      }
    }, (error) => {
      console.error("Firestore error:", error);
      toast.error(error.message || 'Failed to fetch notes');
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleSaveNote = async (noteData) => {
    try {
      if (editingNote) {
        await updateDoc(doc(db, 'notes', editingNote.id), {
          ...noteData,
          updatedAt: serverTimestamp()
        });
        toast.success('Note updated!');
      } else {
        await addDoc(collection(db, 'notes'), {
          ...noteData,
          uid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Note created!');
      }
      closeModal();
    } catch (error) {
      toast.error('Error saving note');
    }
  };

  const handleDelete = async (id) => {
    try {
      await updateDoc(doc(db, 'notes', id), { isTrashed: true, isArchived: false });
      toast.success('Moved to trash');
    } catch (error) {
      toast.error('Failed to move to trash');
    }
  };

  const handleArchive = async (id) => {
    try {
      await updateDoc(doc(db, 'notes', id), { isArchived: true });
      toast.success('Note archived');
    } catch (error) {
      toast.error('Failed to archive note');
    }
  };

  const handlePinToggle = async (id, currentPinState) => {
    try {
      await updateDoc(doc(db, 'notes', id), {
        isPinned: !currentPinState,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      toast.error('Failed to pin note');
    }
  };

  const openModalForEdit = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingNote(null);
    setIsModalOpen(false);
  };

  const filteredNotes = notes.filter(note => 
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-main">Your Notes</h1>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-surface focus:border-primary outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95"
          >
            <FiPlus /> <span className="hidden sm:inline">New Note</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <div className="w-32 h-32 mb-4 opacity-20">
            {/* SVG Illustration Placeholder */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <p className="text-lg">No notes found.</p>
          {searchQuery === '' && <p className="text-sm">Click "New Note" to create one.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                context="dashboard"
                onEdit={() => openModalForEdit(note)}
                onDelete={() => handleDelete(note.id)}
                onPinToggle={() => handlePinToggle(note.id, note.isPinned)}
                onArchiveToggle={() => handleArchive(note.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <NoteModal 
            onClose={closeModal} 
            onSave={handleSaveNote} 
            initialData={editingNote} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
