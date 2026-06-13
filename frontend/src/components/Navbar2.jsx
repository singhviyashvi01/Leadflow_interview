import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchDeals } from '../services/pipelineService';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService';
import api from '../utils/api';

const Navbar2 = ({ userName, userRole, profileImage, placeholder, toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  // Track highest seen notification ID to detect new arrivals
  const lastSeenIdRef = useRef(null);
  // Toast queue: [{ id, message }]
  const [toasts, setToasts] = useState([]);

  const showToast = (message, toastId) => {
    setToasts(prev => {
      // Deduplicate by toastId
      if (prev.find(t => t.id === toastId)) return prev;
      return [...prev, { id: toastId, message }];
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4000);
  };

  const loadNotifications = async () => {
    try {
      // Fire due reminders first, then fetch updated notification list
      await api.post('/api/scheduling/check-reminders/').catch(() => {});
      const data = await fetchNotifications();
      const incoming = data.notifications || [];

      // Detect new unread notifications since last poll
      if (lastSeenIdRef.current !== null && incoming.length > 0) {
        const newOnes = incoming.filter(
          n => !n.is_read && n.id > lastSeenIdRef.current
        );
        newOnes.forEach(n => showToast(n.message, n.id));
      }

      // Update the high-water mark
      if (incoming.length > 0) {
        lastSeenIdRef.current = Math.max(...incoming.map(n => n.id));
      }

      setNotifications(incoming);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // silently fail — bell just shows 0
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000); // poll every 8s for near-realtime
    return () => clearInterval(interval);
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(prev => !prev);
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (searchQuery.length > 0) {
        try {
          const results = await searchDeals(searchQuery);
          setRecommendations(results);
          setShowDropdown(true);
        } catch (error) {
          console.error('Search error:', error);
        }
      } else {
        setRecommendations([]);
        setShowDropdown(false);
      }
    };

    const timeoutId = setTimeout(fetchRecommendations, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowDropdown(false);
    navigate(`/mypipeline?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSelectRecommendation = (deal) => {
    setSearchQuery(deal.company || deal.title);
    setShowDropdown(false);
    navigate(`/mypipeline?q=${encodeURIComponent(deal.company || deal.title)}`);
  };

  return (
    <>
    <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6 relative z-[100]">
      <div className="flex items-center justify-between w-full sm:w-auto gap-4">
        <button 
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[300] lg:hidden p-2 text-[#0e4d46] bg-white rounded-xl border border-gray-100 shadow-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="relative flex-1 sm:w-80 md:w-96" ref={dropdownRef}>
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
              placeholder={placeholder || "Search leads..."} 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/10 text-sm shadow-sm"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0e4d46] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {showDropdown && recommendations.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[200]">
              {recommendations.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => handleSelectRecommendation(deal)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0e4d46]">{deal.company || deal.title}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{deal.stage_name || 'Active Deal'}</span>
                  </div>
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">₹{parseFloat(deal.deal_value).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 text-gray-400 hover:text-[#0e4d46] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-[300] overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
                <span className="text-sm font-bold text-[#0e4d46]">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-[#5a827d] hover:text-[#0e4d46] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm font-bold text-gray-400">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkRead(n.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 items-start ${!n.is_read ? 'bg-[#f0f7f6]' : ''}`}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-[#0e4d46]' : 'bg-gray-200'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#0e4d46] leading-snug">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{fmtTime(n.created_at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <Link to="/profile" className="flex items-center gap-3 group transition-all">
          <div className="text-right group-hover:opacity-80 transition-opacity">
            <p className="text-sm font-bold text-[#0e4d46]">{userName}</p>
            <p className="text-[10px] font-semibold text-[#5a827d] uppercase tracking-wider">{userRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center group-hover:ring-2 group-hover:ring-[#0e4d46]/20 transition-all">
            {profileImage ? (
              <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
        </Link>
      </div>
    </header>

      {/* Toast notifications — fixed bottom-right, outside header flow */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl shadow-xl px-4 py-3 max-w-xs pointer-events-auto animate-in slide-in-from-right-4 duration-300"
            >
              <div className="mt-0.5 w-2 h-2 rounded-full bg-[#0e4d46] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0e4d46] leading-snug">{t.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-gray-300 hover:text-gray-500 shrink-0 -mt-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Navbar2;
