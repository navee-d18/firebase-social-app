import React from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiEdit2, FiStar, FiCopy, FiArchive, FiRefreshCcw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

const NoteCard = ({ note, onEdit, onDelete, onPinToggle, onArchiveToggle, onRestore, onDeletePermanent, context = 'dashboard' }) => {
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    toast.success('Copied to clipboard');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handlePin = (e) => {
    e.stopPropagation();
    onPinToggle();
  };

  const bgColor = note.color && note.color !== 'bg-surface' 
    ? note.color 
    : 'bg-surface';

  // Format date safely
  const dateStr = typeof note.updatedAt?.toMillis === 'function' 
    ? format(note.updatedAt.toMillis(), 'MMM d, yyyy') 
    : (typeof note.createdAt?.toMillis === 'function' ? format(note.createdAt.toMillis(), 'MMM d, yyyy') : 'Just now');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ y: -5 }}
      onClick={onEdit}
      className={`group relative flex flex-col rounded-2xl border border-border/50 p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer h-64 overflow-hidden ${bgColor}`}
    >
      {/* Pin Icon */}
      <button 
        onClick={handlePin}
        className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${note.isPinned ? 'text-yellow-500 bg-yellow-500/10' : 'text-text-muted opacity-0 group-hover:opacity-100 hover:bg-secondary/20'}`}
      >
        <FiStar className={note.isPinned ? "fill-current" : ""} />
      </button>

      <h3 className="font-bold text-lg mb-2 text-text-main pr-8 truncate">
        {note.title || 'Untitled Note'}
      </h3>
      
      <div className="flex-1 overflow-hidden relative">
        <div className="text-text-muted prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>
            {note.content || 'Empty note...'}
          </ReactMarkdown>
        </div>
        {/* Gradient fade out at bottom */}
        <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-${bgColor.split('-')[1] || 'surface'} to-transparent opacity-90`}></div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
        <span className="text-xs text-text-muted/70 font-medium">
          {dateStr}
        </span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {context === 'dashboard' && (
            <>
              <button onClick={handleCopy} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Copy note">
                <FiCopy size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onArchiveToggle(); }} className="p-2 text-text-muted hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Archive note">
                <FiArchive size={14} />
              </button>
              <button onClick={handleDelete} className="p-2 text-text-muted hover:text-danger-color hover:bg-danger-color/10 rounded-lg transition-colors" title="Move to trash">
                <FiTrash2 size={14} />
              </button>
            </>
          )}

          {context === 'archive' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onArchiveToggle(); }} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Unarchive note">
                <FiArchive size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-text-muted hover:text-danger-color hover:bg-danger-color/10 rounded-lg transition-colors" title="Move to trash">
                <FiTrash2 size={14} />
              </button>
            </>
          )}

          {context === 'trash' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onRestore(); }} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Restore note">
                <FiRefreshCcw size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDeletePermanent(); }} className="p-2 text-text-muted hover:text-danger-color hover:bg-danger-color/10 rounded-lg transition-colors" title="Delete permanently">
                <FiTrash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;
