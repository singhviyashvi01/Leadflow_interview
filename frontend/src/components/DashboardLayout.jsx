import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar2 from './Navbar2';

const DashboardLayout = ({ role, userName, userRole }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if(!role) return null;
  
  return (
    <div className="flex h-screen bg-[#e8f3f1] overflow-hidden relative font-sans">
      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-[200] transform transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 lg:h-full
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar role={role} closeSidebar={() => setIsSidebarOpen(false)} />
      </div>
      
      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar pb-24">
          <Navbar2 
            userName={userName} 
            userRole={userRole}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          
          
          <div className="animate-in fade-in duration-500">
            <Outlet />
          </div>
          
        </main>
      </div>

      </div>
    
  );
};

export default DashboardLayout;
