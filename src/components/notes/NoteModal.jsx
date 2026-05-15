import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const NoteModal = ({ onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('bg-surface');

  const colors = [
    { name: 'Default', value: 'bg-surface' },
    { name: 'Red', value: 'bg-red-500/10' },
    { name: 'Yellow', value: 'bg-yellow-500/10' },
    { name: 'Green', value: 'bg-green-500/10' },
    { name: 'Blue', value: 'bg-blue-500/10' },
    { name: 'Purple', value: 'bg-purple-500/10' },
  ];

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setColor(initialData.color || 'bg-surface');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    
    onSave({
      title,
      content,
      color,
      isPinned: initialData?.isPinned || false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${color === 'bg-surface' ? 'bg-surface' : color}`}
      >
        <div className="flex justify-between items-center p-4 border-b border-border/50">
          <div className="flex gap-2">
            {colors.map(c => (
              <button 
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-6 h-6 rounded-full border-2 ${color === c.value ? 'border-primary' : 'border-transparent'} ${c.value === 'bg-surface' ? 'bg-secondary/20' : c.value.replace('/10', '/50')}`}
                title={c.name}
              />
            ))}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/20 transition-colors">
            <FiX className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/50"
              autoFocus
            />
            <textarea 
              placeholder="Take a note... (Markdown supported soon)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 min-h-[200px] resize-none bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/50 text-lg leading-relaxed"
            />
          </div>
          
          <div className="p-4 border-t border-border/50 flex justify-end gap-3 bg-surface/50 backdrop-blur-sm">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 font-medium text-text-muted hover:bg-secondary/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Save Note
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default NoteModal;
