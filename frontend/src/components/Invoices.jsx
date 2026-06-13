import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/auth';
import { fetchInvoices, autoGenerateInvoices, updateInvoiceStatus } from '../services/invoiceService';

const Invoices = () => {
  const [user, setUser] = useState(null);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which menu is open

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoices();
      
      // Robustly handle paginated (object) vs non-paginated (array) vs nested responses
      let invoiceList = [];
      if (Array.isArray(data)) {
        invoiceList = data;
      } else if (data && data.results && Array.isArray(data.results)) {
        invoiceList = data.results;
      } else if (data && data.invoices && Array.isArray(data.invoices)) {
        invoiceList = data.invoices;
      }

      // Data Mapping Function
      const mapped = invoiceList.map(inv => ({
        id: inv.invoice_number || `INV-${inv.id}`,
        dbId: inv.id, // Store DB id for API updates
        client: inv.client_name || 'N/A',
        date: new Date(inv.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }),
        amount: `₹${parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        status: (inv.status || 'pending').toUpperCase(),
        rawAmount: parseFloat(inv.amount)
      }));

      setAllInvoices(mapped);
      setError(null);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError('Could not sync with financial server.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoiceDbId, newStatus) => {
    try {
      await updateInvoiceStatus(invoiceDbId, newStatus);
      // Immediately re-fetch to update UI
      loadInvoices();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update invoice status.');
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      setGenerating(true);
      const res = await autoGenerateInvoices();
      alert(res.message);
      loadInvoices(); // Refresh the list
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Failed to generate invoices. Please ensure deals are marked as WON in the pipeline.');
    } finally {

      setGenerating(false);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    loadInvoices();
  }, []);

  // Logic State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter and Search Processor
  const filteredInvoices = allInvoices.filter(inv => {
    const matchesSearch = inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate Pagination Extents
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  
  // Guard clause to fallback robustly if user filters down to 0 items from Page 3 etc.
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // Splice currently visible slice
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic Metrics Calculation
  const calculateMetrics = () => {
    const total = allInvoices.reduce((sum, inv) => sum + inv.rawAmount, 0);
    const pending = allInvoices.filter(inv => inv.status === 'PENDING')
                               .reduce((sum, inv) => sum + inv.rawAmount, 0);
    const paid = allInvoices.filter(inv => inv.status === 'PAID')
                            .reduce((sum, inv) => sum + inv.rawAmount, 0);
    const overdue = allInvoices.filter(inv => inv.status === 'OVERDUE')
                               .reduce((sum, inv) => sum + inv.rawAmount, 0);
    
    const pendingCount = allInvoices.filter(inv => inv.status === 'PENDING').length;
    const overdueCount = allInvoices.filter(inv => inv.status === 'OVERDUE').length;

    return [
      {
        title: 'Total Invoiced', value: `₹${total.toLocaleString()}`, subtext: 'Updated live', subColor: 'text-emerald-500',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      },
      {
        title: 'Pending Payments', value: `₹${pending.toLocaleString()}`, subtext: `${pendingCount} invoices pending`, subColor: 'text-slate-400',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        title: 'Paid', value: `₹${paid.toLocaleString()}`, subtext: 'Successfully processed', subColor: 'text-emerald-500',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        title: 'Overdue', value: `₹${overdue.toLocaleString()}`, textColor: 'text-red-500', subtext: `${overdueCount} invoices overdue`, subColor: 'text-red-400',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      }
    ];
  };

  const metrics = calculateMetrics();

  const StatusBadge = ({ status }) => {
    const styles = {
      PAID: 'bg-emerald-100/70 text-emerald-600',
      PENDING: 'bg-amber-100/70 text-amber-600',
      OVERDUE: 'bg-red-100/70 text-red-500',
    }[status];

    return (
      <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold tracking-widest uppercase ${styles}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="relative z-10 w-full">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {metrics.map((kpi, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-default"
            >
              <div className="text-[10px] text-[#5a827d] font-extrabold uppercase tracking-widest mb-3">
                {kpi.title}
              </div>
              <div className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-3 ${kpi.textColor || 'text-[#0e4d46]'}`}>
                {kpi.value}
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold ${kpi.subColor}`}>
                {kpi.icon}
                <span>{kpi.subtext}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#f0f7f6] rounded-[2rem] p-4 md:p-8 pb-6 border border-teal-50 shadow-sm relative z-10 w-full">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 px-1 gap-4">
            <h3 className="text-xl font-extrabold text-[#0e4d46]">Recently Generated Invoices</h3>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search Input wired to state */}
              <div className="flex bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] items-center px-4 transition-all focus-within:ring-2 focus-within:ring-teal-500/20 flex-1">
                <svg className="w-4 h-4 text-slate-300 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Jump back to p1 immediately while searching
                  }}
                  placeholder="Search invoices..." 
                  className="py-3 bg-transparent border-none text-xs font-bold text-[#0e4d46] placeholder-slate-400 focus:outline-none focus:ring-0 w-full sm:w-48 xl:w-64"
                />
              </div>
              
              {/* Dynamic Filter Toggle wired to state */}
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center justify-center w-full sm:w-[44px] h-[44px] bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all relative ${
                    isFilterOpen ? 'ring-2 ring-teal-500/20 bg-slate-50' : 'hover:bg-slate-50 hover:shadow-md'
                  }`}
                >
                  <span className="sm:hidden text-xs font-bold text-[#5a827d] mr-2">Filter</span>
                  <svg className={`w-4 h-4 transition-colors ${filterStatus !== 'ALL' ? 'text-[#0e4d46]' : 'text-[#5a827d]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {filterStatus !== 'ALL' && (
                    <span className="absolute top-2 right-2 sm:right-2.5 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
                  )}
                </button>

                {/* Filter Dropdown Body */}
                {isFilterOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-teal-50 z-50 p-2 py-3 cursor-default">
                    <div className="px-3 pb-2 mb-2 border-b border-gray-50 text-[9px] font-extrabold text-[#5a827d] uppercase tracking-widest">
                      Filter by Status
                    </div>
                    {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map(status => (
                      <button 
                        key={status}
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          filterStatus === status 
                            ? 'bg-[#f0f7f6] text-[#0e4d46]' 
                            : 'text-[#5a827d] hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setFilterStatus(status);
                          setCurrentPage(1);
                          setIsFilterOpen(false);
                        }}
                      >
                        {status === 'ALL' ? 'Show All Invoices' : status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Robust Invoices Table */}
          <div className="w-full overflow-x-auto min-h-[380px] -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle px-4 md:px-0">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest leading-none">
                    <th className="px-5 py-4 min-w-[120px]">Invoice #</th>
                    <th className="px-5 py-4 min-w-[200px]">Client Name</th>
                    <th className="px-5 py-4 min-w-[140px]">Date</th>
                    <th className="px-5 py-4 min-w-[160px]">Amount</th>
                    <th className="px-5 py-4 min-w-[120px]">Status</th>
                    <th className="px-5 py-4 text-center min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv) => (
                    <tr key={inv.id} className="bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md group">
                      <td className="px-5 py-4 rounded-l-2xl text-xs font-extrabold text-[#5a827d] transition-colors cursor-pointer group-hover:text-[#0e4d46]">{inv.id}</td>
                      <td className="px-5 py-4 text-xs font-bold text-[#0e4d46] whitespace-nowrap">{inv.client}</td>
                      <td className="px-5 py-4 text-xs font-bold text-[#5a827d] whitespace-nowrap">{inv.date}</td>
                      <td className="px-5 py-4 text-[13px] font-extrabold text-[#0e4d46] truncate">{inv.amount}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center h-full">
                          <StatusBadge status={inv.status} />
                        </div>
                      </td>
                      <td className="px-5 py-4 rounded-r-2xl text-center relative">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                          className="p-2 text-slate-300 hover:text-[#0e4d46] transition-colors rounded-lg hover:bg-slate-50"
                        >
                          <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMenuId === inv.id && (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-40 bg-white rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-teal-50 z-50 p-2 py-2">
                            <button 
                              onClick={() => { handleStatusChange(inv.dbId, 'PAID'); setOpenMenuId(null); }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-[#5a827d] hover:bg-[#f0f7f6] hover:text-[#0e4d46] rounded-lg transition-colors"
                            >
                              Mark as PAID
                            </button>
                            <button 
                              onClick={() => { handleStatusChange(inv.dbId, 'PENDING'); setOpenMenuId(null); }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-[#5a827d] hover:bg-[#f0f7f6] hover:text-[#0e4d46] rounded-lg transition-colors"
                            >
                              Mark as PENDING
                            </button>
                            <button 
                              onClick={() => { handleStatusChange(inv.dbId, 'OVERDUE'); setOpenMenuId(null); }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-[#5a827d] hover:bg-[#fff0f0] hover:text-red-600 rounded-lg transition-colors"
                            >
                              Mark as OVERDUE
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Empty State UI protection */}
                  {paginatedInvoices.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-20 text-[#5a827d] font-bold bg-white rounded-2xl shadow-sm">
                        No invoices match your current search or format.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Logic-Driven Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 px-1 gap-4">
            <div className="text-[10px] font-bold text-[#5a827d] uppercase tracking-widest text-center sm:text-left">
              {filteredInvoices.length > 0 
                ? `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of ${filteredInvoices.length} invoices`
                : 'Showing 0 items'}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold justify-center sm:justify-end flex-wrap">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-[#0e4d46] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg flex justify-center items-center shadow-sm transition-all ${
                      currentPage === page 
                        ? 'bg-white text-[#0e4d46]' 
                        : 'bg-transparent text-slate-400 hover:text-[#0e4d46] hover:bg-white shadow-none'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-[#0e4d46] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                Next
              </button>
            </div>
          </div>

        </div>

      <button 
        onClick={handleGenerateInvoices}
        disabled={generating}
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 flex items-center justify-center gap-2.5 bg-[#0e4d46] text-white px-5 md:px-7 py-3 md:py-4 rounded-[1.2rem] shadow-[0_8px_30px_rgb(14,77,70,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(14,77,70,0.4)] transition-all font-extrabold text-[10px] md:text-xs tracking-wide uppercase z-50 ${generating ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <svg className={`w-4 h-4 shrink-0 ${generating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {generating ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          )}
        </svg>
        <span className="hidden xs:inline">{generating ? 'Generating...' : 'Auto-Generate Invoice'}</span>
        <span className="xs:hidden">{generating ? '...' : 'Generate'}</span>
      </button>

    </div>
  );
};

export default Invoices;
