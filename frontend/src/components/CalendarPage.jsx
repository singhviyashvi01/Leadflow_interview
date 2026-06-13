import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import Calendar from './Calendar';
import { getCurrentUser } from '../utils/auth';

const CalendarPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  return (
      <div className="w-full">
        <Calendar variant="full" />
      </div>
  );
};

export default CalendarPage;
