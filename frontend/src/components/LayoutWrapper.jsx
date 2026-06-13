import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { getCurrentUser } from '../utils/auth';

const LayoutWrapper = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  if (!user) return null; // Or a loading spinner

  return (
    <DashboardLayout 
      role={user.role || 'Sales Rep'}
      userName={`${user.first_name} ${user.last_name}`.trim() || user.email}
      userRole={(user.role || 'Sales Rep').replace('_', ' ')}
    >
      <Outlet />
    </DashboardLayout>
  );
};

export default LayoutWrapper;
