import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { getCurrentUser, logout } from '../utils/auth';
import { getProfile, updateProfile } from '../services/userService';

// MovingNumber component for character/number counting animation
const MovingNumber = ({ value, prefix = "", suffix = "", duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const target = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * target);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {target % 1 === 0 ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
};

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  
  // Form States
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    timezone: "Indian Standard Time (IST)",
    bio: ""
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const apiUser = await getProfile();
        if (mounted && apiUser) {
          const fullName = `${apiUser.first_name} ${apiUser.last_name}`.trim();
          const data = {
            fullName,
            role: apiUser.role || 'sales_representative',
            email: apiUser.email,
            phone: apiUser.phone || '',
            location: apiUser.team || '',
            bio: apiUser.bio || '',
            profile_picture: apiUser.profile_picture || null,
          };
          setUser(data);
          setFormData({
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || '+91 9876543102',
            timezone: 'Indian Standard Time (IST)',
            bio: data.bio || ''
          });
          setIsLoaded(true);
        }
      } catch (err) {
        // If API fails, prefer any stored user; avoid hardcoded manager fallback.
        const currentUser = getCurrentUser();
        if (mounted && currentUser) {
          const data = currentUser;
          setUser(data);
          setFormData({ fullName: data.fullName, email: data.email, phone: data.phone || '+91 9876543102', timezone: 'Indian Standard Time (IST)', bio: data.bio || '' });
          setIsLoaded(true);
        } else {
          // leave in unloaded state and surface an error in console
          console.error('Failed to load profile from API and no cached user found', err);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const fd = new FormData();
        const [firstName, ...lastParts] = formData.fullName.trim().split(' ');
        fd.append('first_name', firstName || '');
        fd.append('last_name', lastParts.join(' ') || '');
        fd.append('phone', formData.phone || '');
        fd.append('bio', formData.bio || '');
        if (profileFile) fd.append('profile_picture', profileFile);

        const res = await updateProfile(fd);
        if (res?.user) {
          // update local copy
          const updated = res.user;
          const fullName = `${updated.first_name} ${updated.last_name}`.trim();
          setUser({ ...user, fullName, email: updated.email, phone: updated.phone, profile_picture: updated.profile_picture });
          // persist to localStorage used by auth utilities
          try { localStorage.setItem('leadflow_user', JSON.stringify({ id: updated.id, first_name: updated.first_name, last_name: updated.last_name, email: updated.email, role: updated.role, profile_picture: updated.profile_picture })); } catch (e) {}
          // inform user of success
          alert('Profile updated successfully');
        }
        setIsEditing(false);
      } catch (err) {
        console.error('Profile save failed', err);
        alert('Failed to update profile. Check console for details.');
      }
    })();
  };

  const performanceMetrics = [
    { label: "Quota Attainment", value: "92", color: "bg-[#0e4d46]" },
    { label: "Team Lead Gen", value: "105", color: "bg-[#0e4d46]" }
  ];

  const renderProfileView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Profile Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f0f7f6] rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
        <div className="w-40 h-40 rounded-[24px] bg-gray-200 border-4 border-white shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 duration-500">
          <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-[#0e4d46] tracking-tight">{user?.fullName}</h1>
              <p className="text-lg font-bold text-[#5a827d] mt-1 capitalize">{user?.role?.replace('_', ' ')}, Mumbai</p>
            </div>
            <button onClick={() => setIsEditing(true)} className="bg-[#0e4d46] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-[#0a3d37] transition-all transform hover:-translate-y-0.5 active:translate-y-0">
              Edit Profile
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-gray-50 text-[#5a827d]">
            <div className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
              <div className="p-2 bg-[#f0f7f6] rounded-lg text-[#0e4d46]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
              <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Email</p><p className="text-sm font-bold text-[#0e4d46] truncate max-w-[150px]">{user?.email}</p></div>
            </div>
            <div className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
              <div className="p-2 bg-[#f0f7f6] rounded-lg text-[#0e4d46]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
              <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Phone</p><p className="text-sm font-bold text-[#0e4d46]">{user?.phone || "+91 9876543102"}</p></div>
            </div>
            <div className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
              <div className="p-2 bg-[#f0f7f6] rounded-lg text-[#0e4d46]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
              <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Office</p><p className="text-sm font-bold text-[#0e4d46]">Mumbai, IN</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col group">
          <h3 className="text-xl font-black text-[#0e4d46] mb-6 flex items-center gap-2 group-hover:gap-3 transition-all duration-300">Professional Bio <span className="w-2 h-2 rounded-full bg-[#0e4d46]"></span></h3>
          <p className="text-[#5a827d] font-medium leading-relaxed text-lg">{user?.bio || "No bio information provided."}</p>
        </div>
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-xl font-black text-[#0e4d46] flex items-center gap-2">Performance <span className="w-2 h-2 rounded-full bg-[#0e4d46]"></span></h3>
          <div className="space-y-6">
            {performanceMetrics.map((metric, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between text-sm font-black text-[#0e4d46]"><span>{metric.label}</span><span className="text-[#5a827d]">{metric.value}%</span></div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`${metric.color} h-full rounded-full transition-all duration-[2000ms] ease-out`} style={{ width: isLoaded ? `${metric.value}%` : '0%' }}/></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#f0f7f6] p-5 rounded-[24px] text-center border border-[#0e4d46]/5 hover:scale-105 transition-transform duration-300"><p className="text-[10px] font-black text-[#5a827d] uppercase tracking-widest mb-1">REVENUE</p><p className="text-xl font-black text-[#0e4d46]">{isLoaded && <MovingNumber value="1.2" prefix="₹" suffix="M" />}</p></div>
            <div className="bg-[#f0f7f6] p-5 rounded-[24px] text-center border border-[#0e4d46]/5 hover:scale-105 transition-transform duration-300"><p className="text-[10px] font-black text-[#5a827d] uppercase tracking-widest mb-1">GROWTH</p><p className="text-xl font-black text-emerald-600">{isLoaded && <MovingNumber value="14" prefix="+" suffix="%" />}</p></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8"><div><h3 className="text-xl font-black text-[#0e4d46]">Reporting Line</h3><p className="text-[#5a827d] text-sm font-bold">Managerial hierarchy overview</p></div><button className="px-6 py-2 border border-gray-200 rounded-xl text-xs font-black text-[#5a827d] hover:bg-gray-50 transition-colors">View Full Org Chart</button></div>
        <div className="flex items-center overflow-x-auto pb-4 gap-4 no-scrollbar">
          <div className="flex items-center gap-4 bg-[#f8fafb] px-6 py-4 rounded-[24px] border border-gray-50 min-w-[200px] hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg></div>
            <div><p className="text-sm font-black text-[#0e4d46]">Hiya Varma</p><p className="text-[10px] font-bold text-[#5a827d] uppercase tracking-widest">Director</p></div>
          </div>
          <div className="text-gray-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></div>
          <div className="flex items-center gap-4 bg-[#0e4d46] px-8 py-5 rounded-[24px] shadow-xl shadow-[#0e4d46]/20 relative z-10 min-w-[220px] scale-105 border-2 border-white/10 hover:brightness-110 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg></div>
            <div>
              <p className="text-md font-black text-white">{user?.fullName}</p>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{user?.role ? `${user.role}`.replace('_', ' ').toUpperCase() + ' (YOU)' : 'YOU'}</p>
            </div>
          </div>
          <div className="text-gray-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></div>
          <div className="flex items-center gap-6 bg-[#f8fafb] px-6 py-4 rounded-[24px] border border-gray-50 min-w-[280px] hover:shadow-md transition-shadow">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((_, i) => (<div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-400"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg></div>))}
              <div className="w-10 h-10 rounded-full bg-[#f0f7f6] border-2 border-white flex items-center justify-center text-[10px] font-black text-[#0e4d46]">+9</div>
            </div>
            <div><p className="text-sm font-black text-[#0e4d46]">12 Reports</p><p className="text-[10px] font-bold text-[#5a827d] uppercase tracking-widest">Direct Team</p></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditProfile = () => (
    <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-[#0e4d46] mb-2 tracking-tight">Edit Profile</h1>
        <p className="text-[#5a827d] font-bold">Update your personal information and professional bio.</p>
      </div>

      <div className="space-y-12">
        {/* Profile Photo Management */}
        <div className="flex items-center gap-8 group">
          <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-[#f0f7f6] shadow-inner flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-black text-[#0e4d46]">Profile Photo</p>
            <p className="text-[10px] font-bold text-[#5a827d] opacity-60">JPG, GIF or PNG. Max size of 800K</p>
            <div className="flex gap-3">
              <input id="profileFileInput" type="file" accept="image/*" className="hidden" onChange={e => setProfileFile(e.target.files[0])} />
              <button type="button" onClick={() => document.getElementById('profileFileInput').click()} className="px-5 py-2.5 bg-[#0e4d46] text-white rounded-xl text-xs font-black shadow-md hover:bg-[#0a3d37] transition-all">Change Photo</button>
              <button type="button" onClick={() => { setProfileFile(null); try { document.getElementById('profileFileInput').value = ''; } catch(e){} }} className="px-5 py-2.5 bg-[#f0f7f6] text-[#0e4d46] rounded-xl text-xs font-black hover:bg-red-50 hover:text-red-600 transition-all">Remove</button>
            </div>
            {profileFile && <div className="text-sm text-gray-600">Selected: {profileFile.name}</div>}
          </div>
        </div>

        <div className="w-full h-px bg-gray-50"></div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div className="space-y-3">
              <label className="text-xs font-black text-[#0e4d46] uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-[#f8fafb] border border-gray-100 text-sm font-bold text-[#0e4d46] focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/10 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-[#0e4d46] uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-[#f8fafb] border border-gray-100 text-sm font-bold text-[#0e4d46] focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/10 focus:bg-white transition-all shadow-sm"
              />
              <p className="text-[10px] font-bold text-[#5a827d] opacity-50 ml-1">Primary email used for account access and notifications.</p>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-[#0e4d46] uppercase tracking-widest ml-1">Phone Number</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-[#f8fafb] border border-gray-100 text-sm font-bold text-[#0e4d46] focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/10 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-[#0e4d46] uppercase tracking-widest ml-1">Timezone</label>
              <select 
                value={formData.timezone}
                onChange={e => setFormData({...formData, timezone: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-[#f8fafb] border border-gray-100 text-sm font-bold text-[#0e4d46] focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/10 focus:bg-white transition-all shadow-sm appearance-none bg-no-repeat bg-[right_1.5rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230e4d46'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.2rem' }}
              >
                <option>Indian Standard Time (IST)</option>
                <option>Pacific Standard Time (PST)</option>
                <option>Eastern Standard Time (EST)</option>
                <option>Greenwich Mean Time (GMT)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end ml-1">
              <label className="text-xs font-black text-[#0e4d46] uppercase tracking-widest">Professional Bio</label>
              <span className={`text-[10px] font-black ${formData.bio.length > 450 ? 'text-red-500' : 'text-[#5a827d] opacity-50'}`}>{formData.bio.length}/500</span>
            </div>
            <textarea 
              rows="4"
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value.slice(0, 500)})}
              className="w-full px-6 py-5 rounded-[24px] bg-[#f8fafb] border border-gray-100 text-sm font-bold text-[#0e4d46] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/10 focus:bg-white transition-all shadow-sm resize-none"
            ></textarea>
            <p className="text-[10px] font-bold text-[#5a827d] opacity-50 ml-1">Brief description for your profile. Maximum 500 characters.</p>
          </div>

          <div className="pt-6 flex justify-end gap-6 border-t border-gray-50">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="px-10 py-3.5 border-2 border-gray-100 rounded-2xl text-xs font-black text-[#5a827d] hover:bg-gray-50 hover:border-gray-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-10 py-3.5 bg-[#0e4d46] text-white rounded-2xl text-xs font-black shadow-xl shadow-[#0e4d46]/20 hover:bg-[#0a3d37] hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
        {isEditing ? renderEditProfile() : renderProfileView()}
    </div>
  );
};

export default ProfilePage;
