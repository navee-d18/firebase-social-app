import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { FiCheckSquare, FiPlus, FiTrash2, FiUsers, FiClock, FiFlag, FiEdit2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

function Tasks() {
  const { currentUser, userData, updateXP } = useAuth();
  const [taskLists, setTaskLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editListTitle, setEditListTitle] = useState('');

  // Fetch task lists (owned or shared)
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'taskLists'), 
      where('participants', 'array-contains', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTaskLists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  // Fetch tasks for active list
  useEffect(() => {
    if (!activeList) return;
    const q = query(collection(db, `taskLists/${activeList.id}/tasks`));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Manual sort to avoid index errors
      fetchedTasks.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });
      setTasks(fetchedTasks);
    });
    return unsub;
  }, [activeList]);

  // Fetch friends for sharing
  useEffect(() => {
    const fetchFriends = async () => {
      if (!userData?.friends?.length) return;
      const q = query(collection(db, 'users'), where('uid', 'in', userData.friends));
      const snap = await getDocs(q);
      setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    if (showShareModal) fetchFriends();
  }, [showShareModal, userData]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const newList = await addDoc(collection(db, 'taskLists'), {
        title: newListTitle.trim(),
        ownerId: currentUser.uid,
        participants: [currentUser.uid],
        createdAt: serverTimestamp()
      });
      setNewListTitle('');
      setShowNewListModal(false);
      toast.success("List created!");
    } catch (err) {
      toast.error("Failed to create list");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activeList) return;
    try {
      await addDoc(collection(db, `taskLists/${activeList.id}/tasks`), {
        text: newTaskText.trim(),
        completed: false,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNewTaskText('');
    } catch (err) {
      toast.error("Failed to add task");
    }
  };

  const toggleTask = async (task) => {
    try {
      const currentStatus = task.completed;
      await updateDoc(doc(db, `taskLists/${activeList.id}/tasks`, task.id), {
        completed: !currentStatus
      });
      if (!currentStatus) updateXP(5); // Reward for completing task
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, `taskLists/${activeList.id}/tasks`, taskId));
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleEditTask = async (taskId) => {
    if (!editingTaskText.trim()) return;
    try {
      await updateDoc(doc(db, `taskLists/${activeList.id}/tasks`, taskId), {
        text: editingTaskText.trim()
      });
      setEditingTask(null);
      toast.success("Task updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleUpdateListTitle = async (e) => {
    e.preventDefault();
    if (!editListTitle.trim()) return;
    try {
      await updateDoc(doc(db, 'taskLists', activeList.id), {
        title: editListTitle.trim()
      });
      setActiveList(prev => ({ ...prev, title: editListTitle.trim() }));
      setShowEditListModal(false);
      toast.success("List updated!");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDeleteList = async () => {
    if (!window.confirm("Are you sure you want to delete this list and all its tasks?")) return;
    try {
      await deleteDoc(doc(db, 'taskLists', activeList.id));
      setActiveList(null);
      setShowEditListModal(false);
      toast.success("List deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleShareList = async (friendId) => {
    try {
      await updateDoc(doc(db, 'taskLists', activeList.id), {
        participants: arrayUnion(friendId)
      });
      toast.success("Shared successfully!");
    } catch (err) {
      toast.error("Sharing failed");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-2 lg:p-4">
      {/* Sidebar: Lists */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest text-primary">
            <FiCheckSquare /> My Lists
          </h2>
          <button 
            onClick={() => setShowNewListModal(true)}
            className="p-3 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <FiPlus size={20} />
          </button>
        </div>

        <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 gap-2 custom-scrollbar">
          {taskLists.map(list => (
            <div key={list.id} className="relative group flex-shrink-0 lg:flex-shrink-1 w-48 lg:w-full">
              <button
                onClick={() => setActiveList(list)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${activeList?.id === list.id ? 'bg-primary text-white border-primary shadow-xl scale-[1.02]' : 'glass dark:glass-dark border-border/50 hover:border-primary/50'}`}
              >
                <p className="font-bold truncate pr-6">{list.title}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${activeList?.id === list.id ? 'text-white/70' : 'text-text-muted'}`}>
                  {list.participants.length > 1 ? 'Shared' : 'Private'}
                </p>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveList(list);
                  setEditListTitle(list.title);
                  setShowEditListModal(true);
                }}
                className={`absolute right-3 top-4 p-2 rounded-lg transition-all ${activeList?.id === list.id ? 'text-white/70 hover:text-white' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
                title="Edit List"
              >
                <FiEdit2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area: Tasks */}
      <div className="flex-1 flex flex-col glass dark:glass-dark rounded-2xl border border-border/50 overflow-hidden">
        {!activeList ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <FiCheckSquare className="w-16 h-16 mb-4 opacity-20" />
            <p>Select or create a list to start tracking tasks</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 lg:p-6 border-b border-border/50 flex items-center justify-between bg-primary/5">
              <div>
                <h3 className="text-xl lg:text-2xl font-black text-text-main tracking-tight">{activeList.title}</h3>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Collaborative Workspace</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditListTitle(activeList.title);
                    setShowEditListModal(true);
                  }}
                  className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-all"
                  title="Edit List Title"
                >
                  <FiEdit2 size={18} />
                  <span className="sr-only">Edit</span>
                </button>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="p-3 bg-secondary text-white rounded-2xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
                >
                  <FiUsers size={18} />
                </button>
              </div>
            </div>

            {/* Task Input */}
            <form onSubmit={handleAddTask} className="p-6 border-b border-border/50">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface focus:border-primary outline-none"
                />
                <button type="submit" className="px-6 bg-primary text-white rounded-xl hover:bg-primary/90 font-bold transition-all">
                  Add
                </button>
              </div>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <AnimatePresence>
                {tasks.map(task => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-4 p-4 bg-surface/50 rounded-xl border border-border/30 group hover:border-primary/30 transition-all"
                  >
                    <button 
                      onClick={() => toggleTask(task)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-secondary/30 hover:border-primary'}`}
                    >
                      {task.completed && <FiCheckSquare />}
                    </button>
                    
                    {editingTask === task.id ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text"
                          value={editingTaskText}
                          onChange={(e) => setEditingTaskText(e.target.value)}
                          className="flex-1 bg-background border border-primary rounded-lg px-2 py-1 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditTask(task.id);
                            if (e.key === 'Escape') setEditingTask(null);
                          }}
                        />
                        <button onClick={() => handleEditTask(task.id)} className="text-primary font-bold text-xs">Save</button>
                        <button onClick={() => setEditingTask(null)} className="text-text-muted text-xs">Cancel</button>
                      </div>
                    ) : (
                      <span className={`flex-1 text-text-main ${task.completed ? 'line-through opacity-50' : ''}`}>
                        {task.text}
                      </span>
                    )}

                    <div className="flex items-center transition-all">
                      <button 
                        onClick={() => {
                          setEditingTask(task.id);
                          setEditingTaskText(task.text);
                        }}
                        className="p-2 text-text-muted hover:text-primary transition-all"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-text-muted hover:text-red-500 transition-all"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Create New Task List</h3>
            <form onSubmit={handleCreateList}>
              <input 
                type="text" 
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="List Title (e.g. Shopping, Project X)"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background mb-4 outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNewListModal(false)} className="flex-1 py-3 bg-secondary/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Share "{activeList.title}"</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-secondary/10 rounded-full"><FiTrash2 /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {friends.length === 0 ? (
                <p className="text-center py-4 text-text-muted text-sm">Add friends first to share lists with them.</p>
              ) : (
                friends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-secondary/5 rounded-xl transition-all border border-transparent hover:border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {friend.photoURL ? <img src={friend.photoURL} alt="" /> : friend.username[0]}
                      </div>
                      <span className="font-medium text-sm">@{friend.username}</span>
                    </div>
                    {activeList.participants.includes(friend.uid) ? (
                      <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold">Shared</span>
                    ) : (
                      <button 
                        onClick={() => handleShareList(friend.uid)}
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90"
                      >Share</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {showEditListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit List</h3>
              <button 
                onClick={handleDeleteList}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
              >
                <FiTrash2 /> Delete List
              </button>
            </div>
            <form onSubmit={handleUpdateListTitle}>
              <input 
                type="text" 
                value={editListTitle}
                onChange={(e) => setEditListTitle(e.target.value)}
                placeholder="List Title"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background mb-4 outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditListModal(false)} className="flex-1 py-3 bg-secondary/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
