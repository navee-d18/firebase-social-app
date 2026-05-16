import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { FiCheckSquare, FiPlus, FiTrash2, FiUsers, FiClock, FiFlag, FiEdit2, FiCpu, FiLayout, FiList, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

function Tasks() {
  const { currentUser, userData, updateXP } = useAuth();
  const [taskLists, setTaskLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'
  const [newListTitle, setNewListTitle] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium'); 
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [friends, setFriends] = useState([]);

  // Fetch task lists (owned or shared)
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'taskLists'), 
      where('participants', 'array-contains', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const lists = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTaskLists(lists);
      if (!activeList && lists.length > 0) setActiveList(lists[0]);
    });
    return unsub;
  }, [currentUser]);

  // Fetch tasks for active list
  useEffect(() => {
    if (!activeList) return;
    const q = query(collection(db, `taskLists/${activeList.id}/tasks`));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedTasks.sort((a, b) => (b.createdAt?.toMillis || 0) - (a.createdAt?.toMillis || 0));
      setTasks(fetchedTasks);
    });
    return unsub;
  }, [activeList]);

  const handleAddTask = async (e, customText = null, status = 'todo') => {
    if (e) e.preventDefault();
    const text = customText || newTaskText;
    if (!text.trim() || !activeList) return;
    
    try {
      await addDoc(collection(db, `taskLists/${activeList.id}/tasks`), {
        text: text.trim(),
        completed: false,
        status: status,
        priority: customText ? 'medium' : taskPriority,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      if (!customText) {
        setNewTaskText('');
        setTaskPriority('medium');
      }
    } catch (err) {
      toast.error("Nexus Link Failed");
    }
  };

  const updateTaskPriority = async (taskId, currentPriority) => {
    const priorities = ['low', 'medium', 'high'];
    const nextPriority = priorities[(priorities.indexOf(currentPriority) + 1) % 3];
    try {
      await updateDoc(doc(db, `taskLists/${activeList.id}/tasks`, taskId), {
        priority: nextPriority
      });
    } catch (err) {
      toast.error("Priority Update Failed");
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const isDone = newStatus === 'done';
      await updateDoc(doc(db, `taskLists/${activeList.id}/tasks`, taskId), {
        status: newStatus,
        completed: isDone
      });
      if (isDone) {
        updateXP(10);
        toast.success("+10 XP Transferred", { icon: '⚡' });
      }
    } catch (err) {
      toast.error("Status Sync Failed");
    }
  };

  const handleAiBrainstorm = async () => {
    if (!activeList) return;
    setIsAiGenerating(true);
    const toastId = toast.loading("AI Assistant Brainstorming Tasks...");
    
    // Simulate AI logic
    await new Promise(r => setTimeout(r, 2000));
    
    const suggestedTasks = [
      `Review ${activeList.title} objectives`,
      `Sync with Nexus Community members`,
      `Update progress log in AI Core`
    ];

    for (const task of suggestedTasks) {
      await handleAddTask(null, task, 'todo');
    }

    toast.success("AI Tasks Generated!", { id: toastId });
    setIsAiGenerating(false);
  };

  const columns = [
    { id: 'todo', title: 'To Do', icon: <FiAlertCircle className="text-secondary" /> },
    { id: 'in-progress', title: 'In Progress', icon: <FiClock className="text-primary" /> },
    { id: 'done', title: 'Completed', icon: <FiCheckSquare className="text-green-400" /> }
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
      
      {/* Sidebar: Command Center */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <div className="flex items-center justify-between p-2">
          <h2 className="text-xl font-black text-text-main flex items-center gap-2 uppercase tracking-widest">
            <FiLayout className="text-primary" /> Nexus Tasks
          </h2>
          <button 
            onClick={() => setShowNewListModal(true)}
            className="p-3 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <FiPlus />
          </button>
        </div>

        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto p-2 custom-scrollbar">
          {taskLists.map(list => (
            <button
              key={list.id}
              onClick={() => setActiveList(list)}
              className={`w-48 lg:w-full flex flex-col p-4 rounded-2xl border transition-all duration-300 ${
                activeList?.id === list.id 
                  ? 'bg-primary/10 border-primary shadow-sm' 
                  : 'bg-surface border-border hover:border-primary/50'
              }`}
            >
              <span className={`font-bold truncate mb-1 ${activeList?.id === list.id ? 'text-primary' : 'text-text-main'}`}>
                {list.title}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-70">
                {list.participants?.length > 1 ? 'Collaborative' : 'Private'}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto premium-card p-4 hidden lg:block border-border/50">
          <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <FiCpu /> AI Insights
          </h3>
          <p className="text-[10px] text-text-muted leading-relaxed italic">
            You've completed 5 tasks this week. Keep up the momentum to reach Level {userData?.level + 1}!
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeList ? (
          <>
            {/* Header Controls */}
            <div className="premium-card p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl text-primary">
                  <FiCheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-text-main tracking-tight">{activeList.title}</h1>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Active Workspace</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-surface-hover p-1.5 rounded-2xl border border-border">
                <button 
                  onClick={() => setViewMode('kanban')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
                >
                  <FiLayout size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
                >
                  <FiList size={20} />
                </button>
                <div className="w-px h-6 bg-border mx-2" />
                <button 
                  onClick={handleAiBrainstorm}
                  disabled={isAiGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-black text-[10px] tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                >
                  <FiCpu className={isAiGenerating ? 'animate-spin' : ''} /> AI BRAINSTORM
                </button>
              </div>
            </div>

            {/* Kanban / List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {viewMode === 'kanban' ? (
                <div className="flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
                  {columns.map(col => (
                    <div key={col.id} className="flex-1 flex flex-col gap-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                          {col.icon} {col.title}
                        </h3>
                        <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-border">
                          {tasks.filter(t => t.status === col.id).length}
                        </span>
                      </div>
                      
                      <div className="flex-1 bg-surface-hover/50 rounded-3xl p-4 border border-border/50 space-y-4">
                        <AnimatePresence mode="popLayout">
                          {tasks.filter(t => (t.status || (t.completed ? 'done' : 'todo')) === col.id).map(task => (
                            <motion.div
                              key={task.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="premium-card p-4 bg-surface border-border hover:border-primary/30 transition-all cursor-pointer group"
                              onClick={() => {
                                const nextStatus = col.id === 'todo' ? 'in-progress' : col.id === 'in-progress' ? 'done' : 'todo';
                                updateTaskStatus(task.id, nextStatus);
                              }}
                            >
                              <p className={`text-sm mb-3 font-medium ${task.completed ? 'line-through opacity-40' : 'text-text-main'}`}>
                                {task.text}
                              </p>
                              <div className="flex items-center justify-between">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateTaskPriority(task.id, task.priority || 'medium'); }}
                                  className="text-[9px] font-black uppercase tracking-tighter text-primary px-2 py-0.5 bg-primary/10 rounded hover:bg-primary hover:text-white transition-all"
                                  title="Change Priority"
                                >
                                  {task.priority || 'medium'}
                                </button>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, `taskLists/${activeList.id}/tasks`, task.id)); }} className="text-text-muted hover:text-red-500">
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {col.id === 'todo' && (
                          <div className="mt-4 space-y-3">
                            <form onSubmit={handleAddTask} className="flex gap-2">
                              <input 
                                type="text" 
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                placeholder="+ Quick Add Task"
                                className="flex-1 bg-transparent border-b border-white/10 py-2 text-xs outline-none focus:border-primary transition-all text-text-main"
                              />
                              <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                                <FiPlus size={14} />
                              </button>
                            </form>
                            <div className="flex gap-2">
                              {['low', 'medium', 'high'].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setTaskPriority(p)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter transition-all ${
                                    taskPriority === p 
                                      ? 'bg-primary text-white shadow-sm' 
                                      : 'bg-surface-hover text-text-muted hover:text-primary border border-border'
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 pb-20">
                  {tasks.map(task => (
                    <motion.div 
                      key={task.id}
                      layout
                      className="premium-card flex items-center justify-between gap-4 p-4 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <button 
                          onClick={() => updateTaskStatus(task.id, task.completed ? 'todo' : 'done')}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-white/10 hover:border-primary'}`}
                        >
                          {task.completed && <FiCheckSquare size={14} />}
                        </button>
                        <span className={`text-sm ${task.completed ? 'line-through opacity-40' : 'text-gray-200'}`}>
                          {task.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => updateTaskPriority(task.id, task.priority || 'medium')}
                          className="text-[9px] font-black uppercase tracking-widest text-text-muted px-2 py-1 bg-surface-hover rounded border border-border hover:border-primary hover:text-primary transition-all"
                          title="Change Priority"
                        >
                          {task.priority || 'medium'}
                        </button>
                        <button onClick={() => deleteDoc(doc(db, `taskLists/${activeList.id}/tasks`, task.id))} className="text-text-muted hover:text-red-500 transition-colors">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-30">
            <FiCheckSquare className="w-24 h-24 mb-6" />
            <p className="text-xl font-bold uppercase tracking-[0.2em]">Select a Nexus Workspace</p>
          </div>
        )}
      </div>

      {/* Modals remain similarly styled to other pages */}
      <AnimatePresence>
        {showNewListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="premium-card w-full max-w-md p-8 bg-surface border-primary/20"
            >
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Initialize Workspace</h2>
              <input 
                type="text" 
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Workspace Identifier..."
                className="w-full px-5 py-4 rounded-2xl bg-black/30 border border-white/5 outline-none focus:border-primary transition-all text-white mb-6"
                autoFocus
              />
              <div className="flex gap-4">
                <button onClick={() => setShowNewListModal(false)} className="flex-1 py-4 bg-white/5 text-text-muted rounded-2xl font-bold hover:bg-white/10">CANCEL</button>
                <button 
                  onClick={async () => {
                    if (!newListTitle.trim()) return;
                    await addDoc(collection(db, 'taskLists'), {
                      title: newListTitle.trim(),
                      ownerId: currentUser.uid,
                      participants: [currentUser.uid],
                      createdAt: serverTimestamp()
                    });
                    setShowNewListModal(false);
                    setNewListTitle('');
                    toast.success("Workspace Online");
                  }}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  CREATE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Tasks;
