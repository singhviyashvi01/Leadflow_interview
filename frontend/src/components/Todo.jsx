import React, { useState, useEffect } from 'react';
import { createTask, updateTask, deleteTask } from '../services/taskService';
import { getCurrentUser } from '../utils/auth';

const Todo = ({ initialItems = [], title = "To-Do List" }) => {
  const [todoItems, setTodoItems] = useState(initialItems);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({ task: '', priority: 'Medium' });
  const [todoToDelete, setTodoToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTodoItems(initialItems);
  }, [initialItems]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.task.trim()) return;
    
    setLoading(true);
    try {
        const user = getCurrentUser();
        const response = await createTask({
            title: newTodo.task,
            priority: newTodo.priority,
            user: user.id
        });

        const newTask = {
            id: response.data.id,
            task: response.data.title,
            priority: response.data.priority,
            completed: response.data.is_completed
        };

        setTodoItems([newTask, ...todoItems]);
        setNewTodo({ task: '', priority: 'Medium' });
        setShowAddTodo(false);
    } catch (err) {
        console.error('Failed to create task', err);
    } finally {
        setLoading(false);
    }
  };

  const toggleTodo = async (id) => {
    const item = todoItems.find(i => i.id === id);
    if (!item) return;

    try {
        await updateTask(id, { is_completed: !item.completed });
        setTodoItems(todoItems.map(i => 
            i.id === id ? { ...i, completed: !i.completed } : i
        ));
    } catch (err) {
        console.error('Failed to toggle task', err);
    }
  };

  const handleDeleteClick = (id) => {
    setTodoToDelete(id);
  };

  const confirmDelete = async () => {
    if (todoToDelete) {
      try {
          await deleteTask(todoToDelete);
          setTodoItems(todoItems.filter(item => item.id !== todoToDelete));
          setTodoToDelete(null);
      } catch (err) {
          console.error('Failed to delete task', err);
      }
    }
  };

  const cancelDelete = () => {
    setTodoToDelete(null);
  };

  const itemBeingDeleted = todoItems.find(item => item.id === todoToDelete);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative">
      {/* Deletion Confirmation Modal */}
      {todoToDelete && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 rounded-3xl animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-[280px] w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0e4d46]">Delete Task?</h3>
              <p className="text-[10px] font-bold text-[#5a827d] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-[#0e4d46]">"{itemBeingDeleted?.task}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 h-10">
              <button 
                onClick={cancelDelete} 
                className="flex-1 text-xs font-black text-[#5a827d] bg-[#f0f7f6] rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 text-xs font-black text-white bg-red-500 rounded-xl shadow-lg hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#0e4d46]">{title}</h2>
        <button 
          onClick={() => setShowAddTodo(!showAddTodo)}
          className="text-xs font-bold text-[#0e4d46] transition-colors hover:opacity-80"
        >
          {showAddTodo ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showAddTodo && (
        <form onSubmit={handleAddTodo} className="mb-6 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-[#5a827d] uppercase mb-1">Task</label>
                <input 
                type="text" 
                placeholder="What needs to be done?"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/10"
                value={newTodo.task}
                onChange={(e) => setNewTodo({...newTodo, task: e.target.value})}
                />
            </div>
            <div className="relative">
                <label className="block text-[10px] font-bold text-[#5a827d] uppercase mb-1">Priority</label>
                <div className="relative">
                  <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/10 appearance-none bg-white font-bold text-[#0e4d46] cursor-pointer"
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({...newTodo, priority: e.target.value})}
                  >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5a827d]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0e4d46] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#0a3d37] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding to List...' : 'Add to List'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {todoItems.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f0f7f6] transition-colors group relative">
            <button 
              onClick={() => toggleTodo(item.id)}
              className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                item.completed ? 'bg-[#0e4d46] border-[#0e4d46]' : 'border-gray-200 group-hover:border-[#0e4d46]'
              }`}
            >
              {item.completed && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold text-[#0e4d46] truncate ${item.completed ? 'line-through opacity-50' : ''}`}>{item.task}</p>
                {item.priority && (
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0
                        ${item.priority === 'High' ? 'bg-red-50 text-red-500' : 
                          item.priority === 'Medium' ? 'bg-orange-50 text-orange-500' : 
                          'bg-blue-50 text-blue-500'}
                    `}>
                        {item.priority}
                    </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => handleDeleteClick(item.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-all transform hover:scale-110"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        {todoItems.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-xs font-bold text-[#5a827d] opacity-50">No tasks remaining. Great job!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Todo;
