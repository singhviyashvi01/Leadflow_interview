import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import Todo from './Todo';
import { getCurrentUser } from '../utils/auth';

const TodoPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  return (
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <h2 className="text-[11px] text-[#5a827d] font-extrabold uppercase tracking-widest mb-6 px-1 text-center sm:text-left">Task Manager</h2>
        <Todo title="Master To-Do List" />
      </div>
  );
};

export default TodoPage;
