import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCpu, FiType, FiCheckCircle, FiAlignLeft, FiEye, FiEdit3 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const NoteModal = ({ onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('bg-surface');
  const [isPreview, setIsPreview] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

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

  // Simulated AI Functions (Replace setTimeout with fetch to your AI API)
  const simulateAiAction = async (actionName, callback) => {
    setIsAiThinking(true);
    const toastId = toast.loading(`AI is ${actionName}...`);
    
    // Simulate network delay
    await new Promise(res => setTimeout(res, 2000));
    
    callback();
    toast.success('Done!', { id: toastId });
    setIsAiThinking(false);
  };

  const handleAiSummarize = () => {
    if (!content.trim()) {
      toast.error('Write some content first!');
      return;
    }
    simulateAiAction('summarizing', () => {
      setContent(prev => prev + '\n\n**✨ AI Summary:**\nThis is an automatically generated summary of your notes. In a real app, this text comes from the OpenAI/Gemini API response based on your content.');
    });
  };

  const handleAiGenerateTitle = () => {
    if (!content.trim()) {
      toast.error('Write some content first!');
      return;
    }
    simulateAiAction('generating title', () => {
      setTitle('✨ ' + (content.split(' ')[0] || 'Generated') + ' Insights');
    });
  };

  const handleAiFixGrammar = () => {
    if (!content.trim()) return;
    simulateAiAction('fixing grammar', () => {
      toast.success('Grammar looks perfect! (Simulation)');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`w-full max-w-5xl h-[90vh] sm:h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col glass-dark border border-white/10`}
      >
        {/* Header Options */}
        <div className="flex justify-between items-center p-4 bg-black/20 border-b border-white/5">
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPreview(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${!isPreview ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5'}`}
            >
              <FiEdit3 /> Write
            </button>
            <button 
              onClick={() => setIsPreview(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isPreview ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-text-muted hover:bg-white/5'}`}
            >
              <FiEye /> Preview
            </button>
          </div>
          
          <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Main Editor Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Editor Area */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
            <input 
              type="text" 
              placeholder="Untitled Document..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-4xl sm:text-5xl font-black bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/30 mb-6"
            />
            
            {isPreview ? (
              <div className="prose prose-invert max-w-none flex-1">
                <ReactMarkdown>{content || '*Nothing to preview...*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea 
                placeholder="Start typing with Markdown... Try adding # Heading, **bold**, or *italic*"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 min-h-[300px] resize-none bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/30 text-lg leading-relaxed font-mono"
              />
            )}
          </div>

          {/* Right Sidebar - AI Tools */}
          <div className="w-full md:w-72 bg-black/30 border-l border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              <FiCpu className="text-primary" /> AI Assistant
            </h3>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleAiSummarize}
                disabled={isAiThinking}
                className="flex items-center gap-3 w-full px-4 py-3 bg-white/5 hover:bg-primary/20 border border-white/5 hover:border-primary/50 rounded-xl transition-all disabled:opacity-50"
              >
                <FiAlignLeft className="text-primary" /> 
                <span className="font-medium text-sm">Summarize Note</span>
              </button>
              
              <button 
                onClick={handleAiGenerateTitle}
                disabled={isAiThinking}
                className="flex items-center gap-3 w-full px-4 py-3 bg-white/5 hover:bg-secondary/20 border border-white/5 hover:border-secondary/50 rounded-xl transition-all disabled:opacity-50"
              >
                <FiType className="text-secondary" /> 
                <span className="font-medium text-sm">Generate Title</span>
              </button>

              <button 
                onClick={handleAiFixGrammar}
                disabled={isAiThinking}
                className="flex items-center gap-3 w-full px-4 py-3 bg-white/5 hover:bg-green-500/20 border border-white/5 hover:border-green-500/50 rounded-xl transition-all disabled:opacity-50"
              >
                <FiCheckCircle className="text-green-400" /> 
                <span className="font-medium text-sm">Fix Grammar</span>
              </button>
            </div>

            <div className="mt-auto pt-6 border-t border-white/5">
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                Tip: Use Markdown for formatting. Changes are auto-saved to Firestore upon clicking Save.
              </p>
              <button 
                onClick={handleSubmit}
                className="w-full py-4 font-bold text-lg bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-[0_0_20px_rgba(129,140,248,0.4)] hover:scale-[1.02] transition-all active:scale-95"
              >
                Save to Cloud
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default NoteModal;
