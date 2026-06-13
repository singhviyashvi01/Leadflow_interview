import React, { useState, useEffect } from 'react';
import Calendar from './Calendar';
import Todo from './Todo';
import { getCurrentUser } from '../utils/auth';
import useDashboardData from '../hooks/useDashboardData';
import { fetchPipelineData } from '../services/pipelineService';
import { fetchReportsSummary, setMonthlyTarget } from '../services/reportService';

const AnimatedNumber = ({ value, prefix = '', suffix = '', isCurrency = false, duration = 1000 }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      
      setCurrent(value * easeProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const formatted = isCurrency 
    ? Math.round(current).toLocaleString() 
    : Number.isInteger(value) 
      ? Math.round(current) 
      : current.toFixed(1);

  return <>{prefix}{formatted}{suffix}</>;
};

const formatMeetingTime = (meeting) => {
  if (meeting.start_time && meeting.end_time) {
    try {
      const start = new Date(meeting.start_time);
      const end = new Date(meeting.end_time);
      const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      const startTimeStr = start.toLocaleTimeString('en-US', timeOptions);
      const endTimeStr = end.toLocaleTimeString('en-US', timeOptions);
      return `${startTimeStr} - ${endTimeStr}`;
    } catch (e) {
      console.error("Error formatting meeting time", e);
    }
  }
  return meeting.time;
};

const formatMeetingDate = (meeting) => {
  if (meeting.start_time) {
    try {
      const start = new Date(meeting.start_time);
      const dateOptions = { month: 'short', day: '2-digit', year: 'numeric' };
      return start.toLocaleDateString('en-US', dateOptions);
    } catch (e) {
      console.error("Error formatting meeting date", e);
    }
  }
  return meeting.date;
};

const ManagerDash = () => {
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboardData();
  const [pipelineData, setPipelineData] = useState(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Monthly target state
  const [targetData, setTargetData] = useState(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetError, setTargetError] = useState('');

  const loadTargetData = async () => {
    try {
      const data = await fetchReportsSummary('last_30_days');
      setTargetData(data);
    } catch (err) {
      console.error('Failed to fetch target data', err);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    const getPipeline = async () => {
      try {
        const data = await fetchPipelineData();
        setPipelineData(data.pipeline);
      } catch (err) {
        console.error('Failed to fetch pipeline', err);
      } finally {
        setPipelineLoading(false);
      }
    };

    getPipeline();
    loadTargetData();
  }, []);

  const handleSaveTarget = async () => {
    setTargetError('');
    const val = targetInput.trim();
    if (!val) {
      setTargetError('Please enter a target amount.');
      return;
    }
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setTargetError('Enter a valid positive number.');
      return;
    }
    setTargetSaving(true);
    try {
      await setMonthlyTarget(val);
      await loadTargetData();
      setShowTargetModal(false);
      setTargetInput('');
    } catch (err) {
      setTargetError('Failed to save target. Please try again.');
    } finally {
      setTargetSaving(false);
    }
  };

  if (dashboardLoading || pipelineLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0e4d46]/20 border-t-[#0e4d46] rounded-full animate-spin"></div>
          <p className="text-[#5a827d] font-bold text-sm">Synchronizing your dashboard...</p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center">
        <p className="text-red-600 font-bold mb-2">Failed to load dashboard data</p>
        <p className="text-red-400 text-sm">{dashboardError}</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || [];
  const teamData = dashboardData?.teamData || [];
  const tasks = dashboardData?.tasks || [];

  return (
    <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Column (Main Content) */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:-translate-y-1">
                <p className="text-[10px] font-bold text-[#5a827d] mb-2 tracking-wider">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-extrabold text-[#0e4d46]">
                    <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} duration={1500} />
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stat.positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline Summary Horizontal Section */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {pipelineData?.map((stage) => (
              <div key={stage.stage_id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm min-w-[200px] flex-1">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-[10px] font-bold text-[#5a827d] uppercase tracking-wider">{stage.stage_name}</h3>
                   <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 text-[#0e4d46] rounded-full">{stage.count}</span>
                </div>
                <p className="text-lg font-bold text-[#0e4d46]">₹{(stage.total_value/1000).toFixed(1)}k</p>
              </div>
            ))}
          </div>

          {/* Team Overview Table */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#0e4d46]">Team Overview</h2>
              <button className="text-xs font-bold text-[#5a827d] hover:text-[#0e4d46] transition-colors">View Full Report</button>
            </div>
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-[#5a827d] uppercase tracking-wider border-b border-gray-50">
                      <th className="pb-4">Sales Executive</th>
                      <th className="pb-4">Deals Won</th>
                      <th className="pb-4">Revenue</th>
                      <th className="pb-4">Conv %</th>
                      <th className="pb-4 text-center">Follow-ups</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {teamData.map((exec, i) => (
                      <tr key={i} className="group hover:bg-gray-50 transition-colors">
                        <td className="py-4 flex items-center gap-3 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-full bg-[#f0f7f6] flex items-center justify-center text-[10px] font-bold text-[#0e4d46]">
                            {exec.name[0]}
                          </div>
                          <span className="text-sm font-bold text-[#0e4d46]">{exec.name}</span>
                        </td>
                        <td className="py-4 text-sm font-semibold text-[#5a827d]">{exec.deals}</td>
                        <td className="py-4 text-sm font-bold text-[#0e4d46]">{exec.revenue}</td>
                        <td className="py-4 text-sm font-semibold text-[#5a827d]">{exec.conv}</td>
                        <td className="py-4 text-center">
                           <span className="text-sm font-bold text-[#0e4d46]">{exec.followUps}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* To-Do List Component */}
          <Todo initialItems={tasks} title="Manager To-Do List" />
        </div>

        {/* Right Column (Side Panels) */}
        <div className="w-full xl:w-80 space-y-8">
          {/* Target vs Achieved */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-[#0e4d46]">Target vs Achieved</h3>
                <button
                  onClick={() => { setTargetInput(''); setTargetError(''); setShowTargetModal(true); }}
                  className="p-1.5 rounded-lg text-[#5a827d] hover:bg-[#f0f7f6] hover:text-[#0e4d46] transition-all"
                  title="Set monthly target"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                  </svg>
                </button>
              </div>

              {(() => {
                const currentRevenue = targetData ? Number(targetData.current_revenue) : 0;
                const target = targetData ? Number(targetData.target) : 0;
                const percentage = target > 0 ? Number(((currentRevenue / target) * 100).toFixed(1)) : 0;
                const clampedPct = Math.min(percentage, 100);
                const circumference = 2 * Math.PI * 70;
                const offset = circumference * (1 - clampedPct / 100);

                return (
                  <>
                    <div className="relative flex justify-center items-center mb-8">
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle cx="80" cy="80" r="70" className="stroke-gray-50" strokeWidth="12" fill="transparent" />
                        <circle
                          cx="80" cy="80" r="70"
                          className="stroke-[#0e4d46] transition-all duration-1000 ease-out"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-[#0e4d46]">{percentage.toFixed(1)}%</span>
                        <span className="text-[10px] font-bold text-[#5a827d]">Monthly Goal</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-2">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-[#5a827d] uppercase mb-1">Current Achieved</p>
                        <p className="text-lg font-bold text-[#0e4d46]">
                          <AnimatedNumber value={currentRevenue} prefix="₹" isCurrency duration={1500} />
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-[#5a827d] uppercase mb-1">Goal Target</p>
                        <p className="text-lg font-bold text-[#0e4d46]">
                          <AnimatedNumber value={target} prefix="₹" isCurrency duration={1500} />
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-[#0e4d46] mb-6">Upcoming Meetings</h3>
              <div className="space-y-4">
                {(dashboardData?.meetings || []).map((meeting, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#f8fafb] border border-gray-50 group hover:border-[#0e4d46]/20 transition-all cursor-pointer">
                      <p className="text-xs font-bold text-[#0e4d46] mb-1">{meeting.title}</p>
                      <p className="text-[10px] font-medium text-[#5a827d]">{formatMeetingTime(meeting)} • {formatMeetingDate(meeting)}</p>
                  </div>
                ))}
                {(!dashboardData?.meetings || dashboardData.meetings.length === 0) && (
                  <p className="text-[10px] font-bold text-[#5a827d] text-center py-4">No upcoming meetings</p>
                )}
              </div>
          </div>

          {/* Calendar */}
          <div className="min-h-0">
              <Calendar variant="mini" />
          </div>
        </div>

        {/* Set Target Modal */}
        {showTargetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-72 border border-gray-100">
              <h4 className="text-sm font-bold text-[#0e4d46] mb-4">Set Monthly Target</h4>
              <input
                type="number"
                min="1"
                step="any"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="Enter target amount"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0e4d46] focus:outline-none focus:border-[#0e4d46] mb-2"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTarget(); }}
                autoFocus
              />
              {targetError && (
                <p className="text-xs text-red-500 font-semibold mb-2">{targetError}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveTarget}
                  disabled={targetSaving}
                  className="flex-1 bg-[#0e4d46] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#0a3d37] transition-colors disabled:opacity-60"
                >
                  {targetSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setShowTargetModal(false); setTargetError(''); }}
                  className="flex-1 border border-gray-200 text-[#5a827d] text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default ManagerDash;
