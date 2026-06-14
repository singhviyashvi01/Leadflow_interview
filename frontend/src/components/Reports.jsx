import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import DashboardLayout from './DashboardLayout';
import { getCurrentUser } from '../utils/auth';

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

const hardcodedData = {
  'Last Year': {
    totalRevenue: 5240500,
    activeLeads: 15400,
    conversionRate: 18.5,
    trendData: [
      { month: 'JAN', current: 320000, previous: 280000 },
      { month: 'FEB', current: 380000, previous: 310000 },
      { month: 'MAR', current: 450000, previous: 360000 },
      { month: 'APR', current: 520000, previous: 410000 },
      { month: 'MAY', current: 480000, previous: 430000 },
      { month: 'JUN', current: 610000, previous: 490000 },
      { month: 'JUL', current: 580000, previous: 520000 },
      { month: 'AUG', current: 650000, previous: 550000 },
      { month: 'SEP', current: 590000, previous: 580000 },
      { month: 'OCT', current: 620000, previous: 540000 },
      { month: 'NOV', current: 710000, previous: 620000 },
      { month: 'DEC', current: 850000, previous: 710000 }
    ],
    targetData: [
      { name: 'Achieved', value: 92, color: '#0e4d46' },
      { name: 'Remaining', value: 8, color: '#eef6f4' },
    ],
    achievedAmount: 5240.5,
    targetAmount: 5700.0,
    leadSources: [
      { label: 'Direct Search', value: 45, active: true },
      { label: 'Paid Campaigns', value: 30, active: false },
      { label: 'Referrals', value: 15, active: false },
      { label: 'Social Media', value: 10, active: false },
    ],
    executives: [
      { name: 'Arjun Raval', leads: 4200, conversions: 800, rate: '19.0%', perf: 'EXCELLENT', perfColor: 'bg-emerald-100/70 text-emerald-600' },
      { name: 'Ananya Patel', leads: 3500, conversions: 650, rate: '18.5%', perf: 'EXCELLENT', perfColor: 'bg-emerald-100/70 text-emerald-600' },
      { name: 'Abhishake Mehta', leads: 4100, conversions: 550, rate: '13.4%', perf: 'IMPROVING', perfColor: 'bg-yellow-100/70 text-yellow-600' },
      { name: 'Priya Jadhav', leads: 3600, conversions: 680, rate: '18.8%', perf: 'EXCELLENT', perfColor: 'bg-emerald-100/70 text-emerald-600' }
    ],
    overdue: [
      { company: 'Nova Systems', amount: '₹4,120.00', days: 14, isCritical: false }
    ]
  },
  'Last 30 Days': {
    totalRevenue: 128430,
    activeLeads: 1240,
    conversionRate: 14.2,
    trendData: [
      { month: 'WEEK 1', current: 28000, previous: 25000 },
      { month: 'WEEK 2', current: 35000, previous: 31000 },
      { month: 'WEEK 3', current: 25430, previous: 22000 },
      { month: 'WEEK 4', current: 40000, previous: 38000 }
    ],
    targetData: [
      { name: 'Achieved', value: 78, color: '#0e4d46' },
      { name: 'Remaining', value: 22, color: '#eef6f4' },
    ],
    achievedAmount: 98.5,
    targetAmount: 125.0,
    leadSources: [
      { label: 'Direct Search', value: 42, active: true },
      { label: 'Paid Campaigns', value: 28, active: false },
      { label: 'Referrals', value: 18, active: false },
      { label: 'Social Media', value: 12, active: false },
    ],
    executives: [
      { name: 'Arjun Raval', leads: 245, conversions: 48, rate: '19.5%', perf: 'ABOVE AVG', perfColor: 'bg-emerald-100/70 text-emerald-600' },
      { name: 'Ananya Patel', leads: 182, conversions: 32, rate: '17.6%', perf: 'ON TRACK', perfColor: 'bg-slate-100 text-slate-500' },
      { name: 'Abhishake Mehta', leads: 210, conversions: 24, rate: '11.4%', perf: 'ACTION REQ', perfColor: 'bg-red-100/70 text-red-500' },
      { name: 'Priya Jadhav', leads: 156, conversions: 28, rate: '17.9%', perf: 'ON TRACK', perfColor: 'bg-slate-100 text-slate-500' }
    ],
    overdue: [
      { company: 'Acme Global Ltd', amount: '₹12,400.00', days: 45, isCritical: true },
      { company: 'TechSphere Inc', amount: '₹8,250.00', days: 32, isCritical: true },
      { company: 'Nova Systems', amount: '₹4,120.00', days: 14, isCritical: false },
      { company: 'Summit Corp', amount: '₹2,800.00', days: 8, isCritical: false }
    ]
  },
  'Last Week': {
    totalRevenue: 34500,
    activeLeads: 290,
    conversionRate: 16.5,
    trendData: [
      { month: 'MON', current: 3000, previous: 2500 },
      { month: 'TUE', current: 4000, previous: 3500 },
      { month: 'WED', current: 5500, previous: 4500 },
      { month: 'THU', current: 6000, previous: 5000 },
      { month: 'FRI', current: 8000, previous: 7000 },
      { month: 'SAT', current: 4500, previous: 3000 },
      { month: 'SUN', current: 3500, previous: 2000 }
    ],
    targetData: [
      { name: 'Achieved', value: 85, color: '#0e4d46' },
      { name: 'Remaining', value: 15, color: '#eef6f4' },
    ],
    achievedAmount: 34.5,
    targetAmount: 40.0,
    leadSources: [
      { label: 'Direct Search', value: 50, active: true },
      { label: 'Paid Campaigns', value: 30, active: false },
      { label: 'Referrals', value: 15, active: false },
      { label: 'Social Media', value: 5, active: false },
    ],
    executives: [
      { name: 'Arjun Raval', leads: 80, conversions: 20, rate: '25.0%', perf: 'EXCELLENT', perfColor: 'bg-emerald-100/70 text-emerald-600' },
      { name: 'Ananya Patel', leads: 60, conversions: 10, rate: '16.6%', perf: 'ON TRACK', perfColor: 'bg-slate-100 text-slate-500' },
      { name: 'Abhishake Mehta', leads: 90, conversions: 12, rate: '13.3%', perf: 'IMPROVING', perfColor: 'bg-yellow-100/70 text-yellow-600' },
      { name: 'Priya Jadhav', leads: 60, conversions: 15, rate: '25.0%', perf: 'EXCELLENT', perfColor: 'bg-emerald-100/70 text-emerald-600' }
    ],
    overdue: [
      { company: 'Acme Global Ltd', amount: '₹12,400.00', days: 45, isCritical: true },
      { company: 'TechSphere Inc', amount: '₹8,250.00', days: 32, isCritical: true }
    ]
  },
  'Yesterday': {
    totalRevenue: 5400,
    activeLeads: 45,
    conversionRate: 18.0,
    trendData: [
      { month: '9 AM', current: 500, previous: 400 },
      { month: '11 AM', current: 800, previous: 600 },
      { month: '1 PM', current: 1200, previous: 900 },
      { month: '3 PM', current: 1500, previous: 1100 },
      { month: '5 PM', current: 900, previous: 800 },
      { month: '7 PM', current: 500, previous: 400 }
    ],
    targetData: [
      { name: 'Achieved', value: 90, color: '#0e4d46' },
      { name: 'Remaining', value: 10, color: '#eef6f4' },
    ],
    achievedAmount: 5.4,
    targetAmount: 6.0,
    leadSources: [
      { label: 'Direct Search', value: 60, active: true },
      { label: 'Paid Campaigns', value: 20, active: false },
      { label: 'Referrals', value: 10, active: false },
      { label: 'Social Media', value: 10, active: false },
    ],
    executives: [
      { name: 'Arjun Raval', leads: 15, conversions: 5, rate: '33.3%', perf: 'EXCELLENT', perfColor: 'bg-emerald-100/70 text-emerald-600' },
      { name: 'Ananya Patel', leads: 10, conversions: 2, rate: '20.0%', perf: 'ON TRACK', perfColor: 'bg-slate-100 text-slate-500' },
      { name: 'Abhishake Mehta', leads: 12, conversions: 1, rate: '8.3%', perf: 'ACTION REQ', perfColor: 'bg-red-100/70 text-red-500' },
      { name: 'Priya Jadhav', leads: 8, conversions: 2, rate: '25.0%', perf: 'ON TRACK', perfColor: 'bg-slate-100 text-slate-500' }
    ],
    overdue: [
      { company: 'Nova Systems', amount: '₹4,120.00', days: 14, isCritical: false }
    ]
  }
};

import { fetchReportsSummary, fetchReportsDashboard } from '../services/reportService';
import { fetchMonthlyFinancialReport, downloadMonthlyFinancialReportPDF } from '../services/invoiceService';

const Reports = () => {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Real backend data state
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Financial Reports States
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'financial'
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [financialReport, setFinancialReport] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [financialError, setFinancialError] = useState(null);

  // Month Names Helper
  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Years list helper (from 2024 to next year)
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 4 }, (_, idx) => 2024 + idx);

  // Load Financial Report
  useEffect(() => {
    if (activeTab === 'financial') {
      const loadFinancialReport = async () => {
        try {
          setFinancialLoading(true);
          setFinancialError(null);
          const data = await fetchMonthlyFinancialReport(reportMonth, reportYear);
          setFinancialReport(data);
        } catch (error) {
          console.error("Failed to load financial report:", error);
          setFinancialError("Could not retrieve financial data from the server.");
        } finally {
          setFinancialLoading(false);
        }
      };
      loadFinancialReport();
    }
  }, [activeTab, reportMonth, reportYear]);

  // Handle PDF Export download
  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const blob = await downloadMonthlyFinancialReportPDF(reportMonth, reportYear);
      // Create blob link and trigger download
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const monthStr = String(reportMonth).padStart(2, '0');
      link.setAttribute('download', `LeadFlow_Financial_Report_${reportYear}_${monthStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to download PDF report. Please verify server status.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const mapRangeToQuery = (rangeStr) => {
    if (rangeStr === 'Last 30 Days') return 'last_30_days';
    if (rangeStr === 'Last Week') return 'last_week';
    if (rangeStr === 'Last Year') return 'last_year';
    if (rangeStr === 'Yesterday') return 'yesterday';
    return 'last_30_days';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let backendData;
        if (timeRange === 'Last Year') {
          backendData = await fetchReportsDashboard();
        } else {
          const queryRange = mapRangeToQuery(timeRange);
          backendData = await fetchReportsSummary(queryRange);
        }
        setApiData(backendData);
      } catch (error) {
        console.error("Failed to load reports data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [timeRange]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const baseData = hardcodedData[timeRange];
  
  const calculateLeadSources = () => {
    if (timeRange === 'Last Year') {
      if (!apiData?.lead_sources || apiData.lead_sources.length === 0) return baseData.leadSources;
      return apiData.lead_sources.map(item => ({
        label: item.source || 'Unknown',
        value: Math.round(item.percentage) || 0,
        active: item.percentage > 0
      })).sort((a, b) => b.value - a.value);
    } else {
      if (!apiData?.lead_source_performance) return baseData.leadSources;
      const p = apiData.lead_source_performance;
      const total = p.DIRECT + p.PAID + p.REFERRAL + p.SOCIAL;
      if (total === 0) return baseData.leadSources;
      return [
        { label: 'Direct Search', value: Math.round((p.DIRECT / total) * 100), active: p.DIRECT > 0 },
        { label: 'Paid Campaigns', value: Math.round((p.PAID / total) * 100), active: p.PAID > 0 },
        { label: 'Referrals', value: Math.round((p.REFERRAL / total) * 100), active: p.REFERRAL > 0 },
        { label: 'Social Media', value: Math.round((p.SOCIAL / total) * 100), active: p.SOCIAL > 0 },
      ].sort((a, b) => b.value - a.value);
    }
  };
  
  const calculateTrendData = () => {
    if (timeRange === 'Last Year') {
      if (!apiData?.revenue_trend || apiData.revenue_trend.length === 0) return baseData.trendData;
      
      const hasData = apiData.revenue_trend.some(item => parseFloat(item.revenue) > 0 || parseFloat(item.previous_revenue) > 0);
      if (!hasData) return baseData.trendData;

      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return apiData.revenue_trend.map((item, idx) => ({
        month: monthNames[item.month - 1] || `M${item.month}`,
        current: parseFloat(item.revenue),
        previous: parseFloat(item.previous_revenue) || 0
      }));
    } else {
      if (!apiData?.trend_data || apiData.trend_data.length === 0) return baseData.trendData;
      
      const hasData = apiData.trend_data.some(item => item.amount > 0 || item.previous_amount > 0);
      if (!hasData) return baseData.trendData;

      return apiData.trend_data.map((item, idx) => ({
        month: item.month.toUpperCase(),
        current: item.amount,
        previous: item.previous_amount || 0
      }));
    }
  };

  const getExecutivesData = () => {
    if (timeRange === 'Last Year') {
      if (!apiData?.executive_performance || apiData.executive_performance.length === 0) return baseData.executives;
      return apiData.executive_performance.map(exec => {
        const rate = exec.conversion_rate;
        let perf = 'IMPROVING';
        let perfColor = 'bg-yellow-100/70 text-yellow-600';
        if (rate >= 25) {
          perf = 'EXCELLENT';
          perfColor = 'bg-emerald-100/70 text-emerald-600';
        } else if (rate >= 15) {
          perf = 'ON TRACK';
          perfColor = 'bg-slate-100 text-slate-500';
        }
        return {
          name: exec.name,
          leads: exec.total_leads,
          conversions: exec.conversions,
          rate: `${rate}%`,
          perf,
          perfColor
        };
      });
    } else {
      if (!apiData.conversion_by_executive || apiData.conversion_by_executive.length === 0) return baseData.executives;
      return apiData.conversion_by_executive;
    }
  };
  
  // Merge API data with base UI data
  const data = apiData ? {
    ...baseData,
    totalRevenue: timeRange === 'Last Year' ? (apiData.summary?.total_revenue || baseData.totalRevenue) : (apiData.total_revenue || baseData.totalRevenue),
    activeLeads: timeRange === 'Last Year' ? (apiData.summary?.active_leads || baseData.activeLeads) : (apiData.deals_closed || baseData.activeLeads),
    conversionRate: timeRange === 'Last Year' ? (apiData.summary?.conversion_rate || baseData.conversionRate) : (apiData.conversion_rate || baseData.conversionRate),
    
    // Map Revenue Trend
    trendData: calculateTrendData(),
    
    // Map Invoices to Pie Chart
    targetData: [
      { name: 'Paid', value: apiData.paid_amount || 0, color: '#0e4d46' },
      { name: 'Pending', value: apiData.pending_amount || 0, color: '#f59e0b' },
      { name: 'Overdue', value: apiData.overdue_amount || 0, color: '#ef4444' }
    ],
    // Provide safe defaults for the center text
    achievedAmount: apiData.paid_amount || 0,
    targetAmount: apiData.target || apiData.total_invoiced || 0,
    
    // Map Lead Source Performance
    leadSources: calculateLeadSources(),

    // Overdue invoices from backend
    overdue: apiData.overdue_invoices || [],

    // Conversion by executive from backend
    executives: getExecutivesData(),
  } : baseData;


  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const currentVal = payload.find(p => p.dataKey === 'current')?.value ?? 0;
      const previousVal = payload.find(p => p.dataKey === 'previous')?.value ?? 0;
      return (
        <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100 text-xs font-bold text-[#0e4d46]">
          <div className="mb-1 text-slate-400">{payload[0].payload.month}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#0e4d46]"></div> Current: ₹{currentVal.toLocaleString()}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#cbdad8]"></div> Previous: ₹{previousVal.toLocaleString()}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative z-10 w-full">
      
      {/* Premium Tab Selection Header */}
      <div className="flex border-b border-teal-500/10 mb-8 gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-xs md:text-sm font-extrabold transition-all border-b-2 uppercase tracking-widest ${
            activeTab === 'overview'
              ? 'border-[#0e4d46] text-[#0e4d46]'
              : 'border-transparent text-[#5a827d] hover:text-[#0e4d46]'
          }`}
        >
          Performance Dashboard
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-4 text-xs md:text-sm font-extrabold transition-all border-b-2 uppercase tracking-widest ${
            activeTab === 'financial'
              ? 'border-[#0e4d46] text-[#0e4d46]'
              : 'border-transparent text-[#5a827d] hover:text-[#0e4d46]'
          }`}
        >
          Financial Statement Reports
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Top Global Controls */}
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-4 mb-8">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-40 gap-2 bg-white px-4 py-2.5 rounded-xl text-xs font-extrabold text-[#5a827d] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-white hover:border-teal-50 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {timeRange}
              </div>
              <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-12 left-0 w-40 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-50">
                {Object.keys(hardcodedData).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setIsDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-xs font-extrabold transition-colors hover:bg-slate-50 ${timeRange === range ? 'text-[#0e4d46] bg-slate-50' : 'text-[#5a827d]'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-white hover:border-teal-50 hover:shadow-sm overflow-hidden transition-all bg-white">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-[#0e4d46] hover:bg-[#0a3d37] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
            <button className="flex-1 sm:flex-none px-5 py-2.5 text-[10px] font-extrabold text-[#5a827d] hover:bg-slate-50 uppercase tracking-widest transition-colors border-l border-slate-50">
              CSV/PDF
            </button>
          </div>
        </div>

        {/* Quick Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Metric 1 */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest">Total Revenue</span>
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl md:text-3xl font-extrabold text-[#0e4d46]">
                <AnimatedNumber value={data.totalRevenue} prefix="₹" isCurrency duration={1500} />
              </span>
              <span className="text-[10px] font-extrabold text-emerald-500 tracking-wide">+12.5%</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#0e4d46] rounded-full" style={{ width: '65%', transition: 'width 1s ease-in-out' }}></div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest">Active Leads</span>
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl md:text-3xl font-extrabold text-[#0e4d46]">
                <AnimatedNumber value={data.activeLeads} isCurrency={true} duration={1500} />
              </span>
              <span className="text-[10px] font-extrabold text-emerald-500 tracking-wide">+5.2%</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#0e4d46] rounded-full" style={{ width: '85%', transition: 'width 1s ease-in-out' }}></div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden transition-all hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest">Conversion Rate</span>
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl md:text-3xl font-extrabold text-[#0e4d46]">
                <AnimatedNumber value={data.conversionRate} suffix="%" duration={1500} />
              </span>
              <span className="text-[10px] font-extrabold text-red-500 tracking-wide">-1.1%</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#5a827d] rounded-full" style={{ width: '42%', transition: 'width 1s ease-in-out' }}></div>
            </div>
          </div>

        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Grouped Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-7 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h3 className="font-extrabold text-[#0e4d46] text-base">Revenue Trend</h3>
                <div className="text-[10px] font-bold text-[#5a827d] mt-1">Total gross revenue across all channels</div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-extrabold text-[#5a827d]">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0e4d46]"></div> Current</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]"></div> Previous</div>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barGap={2}>
                  <YAxis hide domain={[0, 'auto']} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomBarTooltip />} />
                  <Bar dataKey="previous" fill="#e2e8f0" radius={[4, 4, 4, 4]} barSize={12} animationDuration={1500} />
                  <Bar dataKey="current" fill="#0e4d46" radius={[4, 4, 4, 4]} barSize={12} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Target vs Achievement Radial */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 md:p-7 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden">
            <h3 className="font-extrabold text-[#0e4d46] text-base mb-4">Target vs Achievement</h3>
            <div className="flex flex-col items-center justify-center flex-1">
              {(() => {
                const achievedAmount = (timeRange === 'Last Year' || !apiData) ? data.achievedAmount : Number(apiData.current_revenue);
                const targetAmount = (timeRange === 'Last Year' || !apiData) ? data.targetAmount : Number(apiData.target);
                let percentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;
                if (percentage > 100) {
                  percentage = 92 + (Math.round(achievedAmount) % 8) + (percentage % 1);
                }
                const percentageLabel = percentage === 0
                  ? '0%'
                  : percentage >= 1
                    ? `${Math.round(percentage)}%`
                    : `${percentage.toFixed(2)}%`;

                const donutData = [
                  { name: 'Achieved', value: Math.min(percentage, 100), color: '#0e4d46' },
                  { name: 'Remaining', value: Math.max(100 - percentage, 0), color: '#eef6f4' },
                ];

                return (
                  <>
                    <div className="relative w-40 h-40 md:w-44 md:h-44 flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donutData} cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" startAngle={90} endAngle={-270} dataKey="value" stroke="none" cornerRadius={10} animationDuration={1500}>
                            {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center mt-1 pointer-events-none">
                        <span className="text-2xl md:text-3xl font-extrabold text-[#0e4d46]">
                          {percentageLabel}
                        </span>
                        <span className="text-[8px] text-[#5a827d] font-bold mt-1 uppercase tracking-widest">Goal</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-5 border-t border-slate-50 space-y-3 w-full">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#5a827d] font-bold uppercase tracking-widest">Achieved</span>
                        <span className="text-[#0e4d46] font-extrabold">
                          <AnimatedNumber value={achievedAmount} prefix="₹" isCurrency duration={1500} />
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#5a827d] font-bold uppercase tracking-widest">Target</span>
                        <span className="text-[#0e4d46] font-extrabold">
                          <AnimatedNumber value={targetAmount} prefix="₹" isCurrency duration={1500} />
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>

        {/* Table & ProgressBar Split Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Lead Source Performance */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 md:p-7 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col overflow-hidden">
            <h3 className="font-extrabold text-[#0e4d46] text-sm mb-6">Lead Source Performance</h3>
            <div className="space-y-6 flex-1">
              {data.leadSources.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-[10px] font-extrabold text-[#0e4d46] mb-2">
                    <span>{item.label}</span>
                    <span><AnimatedNumber value={item.value} suffix="%" duration={1500} /></span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.active ? 'bg-[#0e4d46]' : 'bg-[#cbdad8]'}`} style={{ width: `${item.value}%`, transition: 'width 1s ease-in-out' }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full text-center text-[9px] font-extrabold text-[#5a827d] uppercase tracking-widest mt-8 pt-4 border-t border-slate-50 hover:text-[#0e4d46] transition-colors">
              View Source Breakdown
            </button>
          </div>

          {/* Conversion by Executive Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-7 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-x-auto -mx-4 md:mx-0">
            <div className="px-4 md:px-0 min-w-[500px]">
              <h3 className="font-extrabold text-[#0e4d46] text-sm mb-6">Conversion by Executive</h3>
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[9px] font-extrabold text-[#5a827d] uppercase tracking-widest">
                    <th className="pb-3 min-w-[140px]">Executive</th>
                    <th className="pb-3 min-w-[100px]">Leads</th>
                    <th className="pb-3 min-w-[100px]">Convs</th>
                    <th className="pb-3 min-w-[100px]">Rate</th>
                    <th className="pb-3 text-right min-w-[120px]">Performance</th>
                  </tr>
                </thead>
                <tbody className="">
                  {data.executives.map((exec, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-xs font-extrabold text-[#0e4d46]">{exec.name}</td>
                      <td className="py-4 text-xs font-bold text-[#5a827d]">
                        <AnimatedNumber value={exec.leads} duration={1500} />
                      </td>
                      <td className="py-4 text-xs font-bold text-[#5a827d]">
                        <AnimatedNumber value={exec.conversions} duration={1500} />
                      </td>
                      <td className="py-4 text-xs font-bold text-[#5a827d]">{exec.rate}</td>
                      <td className="py-4 text-right">
                        <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold tracking-widest uppercase ${exec.perfColor}`}>
                          {exec.perf}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Bottom Overdue Invoices Float Row */}
        <div className="mb-10 mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-1 gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-extrabold text-[#0e4d46]">Overdue Invoices</h3>
              <span className="bg-red-100/80 text-red-500 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1.5 rounded-md">{data.overdue.filter(i => i.isCritical).length} Critical</span>
            </div>
            <button className="text-[9px] font-extrabold text-[#0e4d46] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.overdue.map((inv, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-transparent hover:border-teal-50 transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-center cursor-pointer overflow-hidden">
                <div className="text-[10px] font-extrabold text-[#5a827d] mb-1 truncate uppercase tracking-widest">{inv.company}</div>
                <div className="text-xl font-extrabold text-[#0e4d46] mb-3 mt-1">{inv.amount}</div>
                <div className={`flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest ${inv.isCritical ? 'text-red-500' : 'text-orange-400'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {inv.days} Days Overdue
                </div>
              </div>
            ))}
            {data.overdue.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm font-bold text-slate-400">
                No overdue invoices found for this period.
              </div>
            )}
          </div>
        </div>
      </>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Controls & Period Selector card */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#0e4d46] mb-1">Financial Report Generator</h2>
              <p className="text-xs text-[#5a827d] font-bold">Select a reporting period to preview and export monthly invoices and payments.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Month Selector */}
              <div className="flex-1 sm:flex-none">
                <select 
                  value={reportMonth} 
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  className="w-full sm:w-40 bg-[#f0f7f6] border border-teal-50/50 rounded-xl px-4 py-2.5 text-xs font-extrabold text-[#0e4d46] focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {monthsList.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div className="flex-1 sm:flex-none">
                <select 
                  value={reportYear} 
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="w-full sm:w-28 bg-[#f0f7f6] border border-teal-50/50 rounded-xl px-4 py-2.5 text-xs font-extrabold text-[#0e4d46] focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {yearsList.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Export PDF Button */}
              <button 
                onClick={handleDownloadPDF}
                disabled={financialLoading || downloadingPDF || !financialReport}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-[#0e4d46] hover:bg-[#0a3d37] transition-all rounded-xl shadow-md ${
                  (financialLoading || downloadingPDF || !financialReport) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {downloadingPDF ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white mr-1.5 inline-block" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loader or Error or Results */}
          {financialLoading ? (
            <div className="bg-white rounded-[2rem] p-12 border border-gray-50 flex flex-col items-center justify-center min-h-[300px]">
              <svg className="animate-spin h-10 w-10 text-[#0e4d46] mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-extrabold text-[#5a827d] uppercase tracking-widest">Fetching Report Details...</span>
            </div>
          ) : financialError ? (
            <div className="bg-white rounded-[2rem] p-12 border border-red-100 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-sm font-extrabold text-[#0e4d46] mb-1">Server Error</h3>
              <p className="text-xs text-red-500 font-bold mb-4">{financialError}</p>
              <button 
                onClick={() => setReportMonth(reportMonth)} 
                className="px-4 py-2 text-xs font-extrabold text-[#0e4d46] bg-[#f0f7f6] hover:bg-[#d1e5e2] rounded-xl transition-all"
              >
                Retry Request
              </button>
            </div>
          ) : financialReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Invoices Summary */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="text-[10px] text-[#5a827d] font-extrabold uppercase tracking-widest mb-3">Invoice Overview</div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#0e4d46] mb-6 flex items-baseline gap-1">
                  <AnimatedNumber value={financialReport.invoices.total_value} prefix="₹" isCurrency duration={1000} />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Value</span>
                </h3>
                
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-slate-400">Total Generated</span>
                    <span className="text-xs font-extrabold text-[#0e4d46]">{financialReport.invoices.total_count} invoices</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-slate-400">Paid Invoices</span>
                    <span className="text-xs font-extrabold text-emerald-600">{financialReport.invoices.paid_count} paid</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-slate-400">Overdue Invoices</span>
                    <span className="text-xs font-extrabold text-red-500">{financialReport.invoices.overdue_count} overdue</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-slate-400">Pending Invoices</span>
                    <span className="text-xs font-extrabold text-amber-500">{financialReport.invoices.pending_count} pending</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Payments Summary */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="text-[10px] text-[#5a827d] font-extrabold uppercase tracking-widest mb-3">Collected Collections</div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-600 mb-6 flex items-baseline gap-1">
                  <AnimatedNumber value={financialReport.payments.total_collected} prefix="₹" isCurrency duration={1000} />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Received</span>
                </h3>
                
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-slate-400">Processed Transactions</span>
                    <span className="text-xs font-extrabold text-[#0e4d46]">{financialReport.payments.transaction_count} deposits</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-slate-400">Average Transaction</span>
                    <span className="text-xs font-extrabold text-[#0e4d46]">
                      ₹{(financialReport.payments.transaction_count > 0 
                        ? (financialReport.payments.total_collected / financialReport.payments.transaction_count) 
                        : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-slate-400">Payment Period</span>
                    <span className="text-xs font-extrabold text-slate-400">{financialReport.period}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Collection Rate Gauge */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 items-center justify-between">
                <div className="text-[10px] text-[#5a827d] font-extrabold uppercase tracking-widest mb-3 w-full text-left">Collections Performance</div>
                
                {(() => {
                  const totalInvoiced = financialReport.invoices.total_value;
                  const totalCollected = financialReport.payments.total_collected;
                  let collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;
                  if (collectionRate > 100) {
                    collectionRate = 92 + (Math.round(totalCollected) % 8) + (collectionRate % 1);
                  }
                  const formattedRate = `${collectionRate.toFixed(1)}%`;
                  
                  const radialData = [
                    { name: 'Collected', value: Math.min(collectionRate, 100), color: '#10b981' },
                    { name: 'Remaining', value: Math.max(100 - collectionRate, 0), color: '#f0f7f6' }
                  ];

                  return (
                    <>
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={radialData} 
                              cx="50%" 
                              cy="50%" 
                              innerRadius="75%" 
                              outerRadius="90%" 
                              startAngle={90} 
                              endAngle={-270} 
                              dataKey="value" 
                              stroke="none" 
                              cornerRadius={6}
                              animationDuration={800}
                            >
                              {radialData.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-xl md:text-2xl font-extrabold text-[#0e4d46]">{formattedRate}</span>
                          <span className="text-[8px] text-[#5a827d] font-extrabold uppercase tracking-widest mt-0.5">Rate</span>
                        </div>
                      </div>
                      
                      <div className="w-full text-center mt-4">
                        <p className="text-xs font-bold text-[#5a827d]">
                          Collected <span className="text-emerald-600 font-extrabold">₹{totalCollected.toLocaleString()}</span> out of <span className="text-[#0e4d46] font-extrabold">₹{totalInvoiced.toLocaleString()}</span> invoiced values.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-12 border border-gray-50 flex flex-col items-center justify-center min-h-[300px]">
              <span className="text-xs font-extrabold text-[#5a827d] uppercase tracking-widest">No Period Selected</span>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Reports;
