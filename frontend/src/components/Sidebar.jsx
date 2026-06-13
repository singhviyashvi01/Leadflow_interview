import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

const Sidebar = ({ role,active }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isManager = role === 'Sales Manager' || role === 'sales_manager';

  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 
      path: '/dashboard' 
    },
    // Team Overview ONLY for Managers
    ...(isManager ? [{ 
      name: 'Team Overview', 
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', 
      path: '/team-overview' 
    }] : []),
    // Pipeline for EVERYONE (labeled differently if desired, but here unified)
    { 
      name: isManager ? 'Team Pipeline' : 'My Pipeline', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 
      path: '/mypipeline' 
    },
    // Invoices and Reports ALWAYS visible
    { 
      name: 'Invoices', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 
      path: '/invoices' 
    },
    { 
      name: 'Reports', 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', 
      path: '/reports' 
    },
    { 
      name: 'Calendar', 
      icon: 'M13.89 8.39l-4.28 4.28L7.5 10.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 
      path: '/calendar' 
    },
  ];

  return (
    <div className="w-64 bg-[#f8fafb] h-full border-r border-gray-200 flex flex-col relative overflow-y-auto custom-scrollbar">
      <div className="p-6 flex items-center gap-3 mb-8">
        {/* <div className="w-8 h-8 bg-black rounded shrink-0" /> */}
        <img
            src={"logo.png"
            }
            alt="LeadFlow Logo"
            className="w-10 h-10 object-contain shrink-0 -mr-1"
      />
        <span className="text-xl font-extrabold text-[#0e4d46]">LeadFlow</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          item.path && (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                location.pathname === item.path
                  ? 'bg-[#0e4d46] text-white shadow-md'
                  : 'text-[#5a827d] hover:bg-[#e8f3f1] hover:text-[#0e4d46]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
              {item.name}
            </Link>
          )
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-gray-100 flex flex-col gap-2">


<Link 
  to="/settings"
  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
    location.pathname === "/settings"
      ? "bg-[#0e4d46] text-white"
      : "text-[#5a827d] hover:bg-[#d1e5e2] hover:text-[#0e4d46]"
  }`}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  </svg>
  Settings
</Link>


        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

