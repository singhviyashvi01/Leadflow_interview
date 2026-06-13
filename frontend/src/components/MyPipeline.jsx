import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '../utils/auth';
import { fetchPipelineData, deleteDeal, createDeal, searchDeals } from '../services/pipelineService';

const MyPipeline = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [user, setUser] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [lists, setLists] = useState({
    newLead: [],
    contacted: [],
    negotiation: [],
    closedLost: []
  });

  const [isAdding, setIsAdding] = useState(null); // stores the stage key
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealPriority, setNewDealPriority] = useState('medium');
  const [newDealResult, setNewDealResult] = useState(''); // New state
  const [newDealLeadSource, setNewDealLeadSource] = useState('DIRECT');

  const loadData = async () => {
    try {
      setLoading(true);
      
      const newLists = {
        newLead: [],
        contacted: [],
        negotiation: [],
        closedLost: []
      };

      if (searchQuery) {
        const deals = await searchDeals(searchQuery);
        
        deals.forEach(deal => {
          const mappedDeal = {
            id: deal.id,
            title: deal.title,
            company: deal.company || deal.title,
            value: `₹${parseFloat(deal.deal_value).toLocaleString()}`,
            tag: deal.result ? deal.result : (deal.priority || 'medium').toUpperCase() + ' PRIORITY',
            result: deal.result,
            assignedTo: deal.assigned_to_name || null,
          };

          if (deal.is_won || deal.is_lost || deal.result === 'WON' || deal.result === 'LOST' || deal.stage === 4) {
            newLists.closedLost.push(mappedDeal);
          } else if (deal.stage === 1) {
            newLists.newLead.push(mappedDeal);
          } else if (deal.stage === 2) {
            newLists.contacted.push(mappedDeal);
          } else if (deal.stage === 3) {
            newLists.negotiation.push(mappedDeal);
          } else {
            newLists.newLead.push(mappedDeal);
          }
        });
      } else {
        const data = await fetchPipelineData();

        data.pipeline.forEach(stage => {
          const stageMapped = stage.deals.map(deal => ({
            id: deal.id,
            title: deal.title,
            company: deal.company || deal.title,
            value: `₹${parseFloat(deal.deal_value).toLocaleString()}`,
            tag: deal.result ? deal.result : (deal.priority || 'medium').toUpperCase() + ' PRIORITY',
            result: deal.result,
            assignedTo: deal.assigned_to_name || null,
          }));

          if (stage.stage_name === 'Discovery') newLists.newLead = stageMapped;
          else if (stage.stage_name === 'Proposal') newLists.contacted = stageMapped;
          else if (stage.stage_name === 'Negotiation') newLists.negotiation = stageMapped;
          else if (stage.stage_name === 'Closed') newLists.closedLost = [...newLists.closedLost, ...stageMapped];
          else {
            if (newLists.newLead.length === 0) newLists.newLead = stageMapped;
          }
        });

        const closed = data.closed_deals.map(deal => ({
          id: deal.id,
          title: deal.title,
          company: deal.company || deal.title,
          value: `₹${parseFloat(deal.deal_value).toLocaleString()}`,
          tag: 'WON',
          result: 'WON',
          assignedTo: deal.assigned_to_name || null,
        }));
        const lost = data.lost_deals.map(deal => ({
          id: deal.id,
          title: deal.title,
          company: deal.company || deal.title,
          value: `₹${parseFloat(deal.deal_value).toLocaleString()}`,
          tag: 'LOST',
          result: 'LOST',
          assignedTo: deal.assigned_to_name || null,
        }));

        newLists.closedLost = [...newLists.closedLost, ...closed, ...lost];
      }

      setLists(newLists);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch pipeline data:', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      setError('Failed to load your pipeline. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    loadData();
  }, [searchQuery]); // Reload when search query changes

  const STAGE_ID_MAP = {
    newLead: 1,
    contacted: 2,
    negotiation: 3,
    closedLost: 4,
  };

  const handleAddDeal = async (e) => {
    e.preventDefault();
    try {
      await createDeal({
        title: newDealTitle,
        deal_value: parseFloat(newDealValue) || 0,
        priority: newDealPriority,
        result: newDealResult || null,
        lead_source: newDealLeadSource,
        stage_id: STAGE_ID_MAP[isAdding] ?? 1,
      });
      setNewDealTitle('');
      setNewDealValue('');
      setNewDealResult('');
      setNewDealLeadSource('DIRECT');
      setIsAdding(null);
      loadData();
    } catch (err) {
      console.error('Failed to add deal:', err);
      alert('Failed to add deal.');
    }
  };

  const handleMarkStatus = async (dealId, result) => {
    try {
      await updateDeal(dealId, { 
        result, 
        is_won: result === 'WON', 
        is_lost: result === 'LOST',
        stage: 4 // Ensure it's moved to "Closed" stage in DB
      });
      loadData();
    } catch (err) {
      console.error('Failed to update deal status:', err);
      alert('Failed to update deal status.');
    }
  };

  const checkTrashProximity = (info) => {
    const trashBin = document.getElementById('trash-bin');
    if (trashBin) {
      const rect = trashBin.getBoundingClientRect();
      const trashCenterX = rect.left + rect.width / 2;
      const trashCenterY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(info.point.x - trashCenterX, 2) + 
        Math.pow(info.point.y - trashCenterY, 2)
      );

      setIsOverTrash(distance < 80);
      return distance < 80;
    }
    return false;
  };

  const handleDragEnd = (event, info, listKey, card) => {
    const isOver = checkTrashProximity(info);
    setIsOverTrash(false);

    if (isOver) {
      setItemToDelete({ ...card, listKey });
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteDeal(itemToDelete.id);
        setLists(prev => ({
          ...prev,
          [itemToDelete.listKey]: prev[itemToDelete.listKey].filter(c => c.id !== itemToDelete.id)
        }));
        setItemToDelete(null);
      } catch (err) {
        console.error('Failed to delete deal:', err);
        alert('Failed to delete lead from server.');
      }
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
  };

  const getTagColor = (tag) => {
    switch (tag) {
      case 'HIGH PRIORITY': return 'text-slate-500';
      case 'MEDIUM PRIORITY': return 'text-blue-500';
      case 'LOW PRIORITY': return 'text-orange-500';
      case 'INQUIRY': return 'text-slate-400';
      case 'FOLLOW-UP': return 'text-blue-500';
      case 'REVIEW': return 'text-yellow-500';
      case 'WON': return 'text-green-500';
      case 'LOST': return 'text-red-400';
      default: return 'text-gray-500';
    }
  };

  const isManager = user?.role?.toLowerCase().includes('manager') ?? false;

  const renderCard = (card, listKey) => (
    <motion.div
      key={card.id}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      drag
      dragSnapToOrigin
      onDrag={(e, info) => checkTrashProximity(info)}
      onDragEnd={(e, info) => handleDragEnd(e, info, listKey, card)}
      whileDrag={{ scale: 1.05, zIndex: 100, opacity: 0.85, cursor: 'grabbing' }}
      className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[6rem] cursor-grab transition-shadow relative bg-clip-padding touch-none z-10"
    >
      <div className="font-extrabold text-[#0e4d46] text-sm truncate pointer-events-none">{card.company}</div>
      {isManager && card.assignedTo && (
        <div className="text-[10px] font-semibold text-[#5a827d] truncate pointer-events-none">
          {card.assignedTo}
        </div>
      )}
      <div className="flex justify-between items-end">
        <span className="text-slate-400 text-xs font-bold pointer-events-none">{card.value}</span>
        
        {listKey === 'closedLost' && !card.result ? (
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleMarkStatus(card.id, 'WON'); }}
              className="text-[8px] font-black bg-green-50 text-green-600 px-2 py-1 rounded-md border border-green-100 hover:bg-green-100 transition-colors cursor-pointer"
            >
              WON
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleMarkStatus(card.id, 'LOST'); }}
              className="text-[8px] font-black bg-red-50 text-red-500 px-2 py-1 rounded-md border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
            >
              LOST
            </button>
          </div>
        ) : (
          <span className={`text-[9px] font-extrabold tracking-widest uppercase pointer-events-none ${getTagColor(card.tag)}`}>
            {card.tag}
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
    <div className="relative z-10 min-h-0">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-[11px] text-[#5a827d] font-extrabold uppercase tracking-widest">Deal Pipeline</h2>
          {searchQuery && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Showing results for: <span className="text-[#0e4d46]">"{searchQuery}"</span></span>
              <button 
                onClick={() => window.history.pushState({}, '', window.location.pathname)} 
                className="text-[10px] font-extrabold text-teal-600 hover:text-teal-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-teal-100 border-t-[#0e4d46] rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Syncing pipeline data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-10 rounded-3xl border border-red-100 text-center">
            <p className="text-red-600 font-bold mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start relative z-10">
            
            {/* Column: New Lead */}
            <div className="bg-[#f0f7f6] rounded-3xl p-5 border border-teal-50 min-h-[150px]">
              <div className="flex justify-between items-center mb-5 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span className="font-extrabold text-[#0e4d46] text-sm">New Lead</span>
                  <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center transition-all">
                    {lists.newLead.length}
                  </span>
                </div>
                <button onClick={() => setIsAdding('newLead')} className="text-slate-400 font-bold hover:text-slate-600 tracking-widest leading-none">...</button>
              </div>
              <div className="space-y-3 relative">
                <AnimatePresence mode="popLayout">
                  {lists.newLead.map(card => renderCard(card, 'newLead'))}
                </AnimatePresence>
                {lists.newLead.length === 0 && searchQuery && <div className="py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matches</div>}
              </div>
            </div>

            {/* Column: Contacted */}
            <div className="bg-[#f0f7f6] rounded-3xl p-5 border border-teal-50 min-h-[150px]">
              <div className="flex justify-between items-center mb-5 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="font-extrabold text-[#0e4d46] text-sm">Contacted</span>
                  <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center transition-all">
                    {lists.contacted.length}
                  </span>
                </div>
                <button onClick={() => setIsAdding('contacted')} className="text-slate-400 font-bold hover:text-slate-600 tracking-widest leading-none">...</button>
              </div>
              <div className="space-y-3 relative">
                <AnimatePresence mode="popLayout">
                  {lists.contacted.map(card => renderCard(card, 'contacted'))}
                </AnimatePresence>
                {lists.contacted.length === 0 && searchQuery && <div className="py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matches</div>}
              </div>
            </div>

            {/* Column: Negotiation */}
            <div className="bg-[#f0f7f6] rounded-3xl p-5 border border-teal-50 min-h-[150px]">
              <div className="flex justify-between items-center mb-5 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="font-extrabold text-[#0e4d46] text-sm">Negotiation</span>
                  <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center transition-all">
                    {lists.negotiation.length}
                  </span>
                </div>
                <button onClick={() => setIsAdding('negotiation')} className="text-slate-400 font-bold hover:text-slate-600 tracking-widest leading-none">...</button>
              </div>
              <div className="space-y-3 relative">
                <AnimatePresence mode="popLayout">
                    {lists.negotiation.map(card => renderCard(card, 'negotiation'))}
                </AnimatePresence>
                {lists.negotiation.length === 0 && searchQuery && <div className="py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matches</div>}
              </div>
            </div>

            {/* Column: Closed / Lost */}
            <div className="bg-[#f0f7f6] rounded-3xl p-5 border border-teal-50 min-h-[150px]">
              <div className="flex justify-between items-center mb-5 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="font-extrabold text-[#0e4d46] text-sm">Closed / Lost</span>
                  <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center transition-all">
                    {lists.closedLost.length}
                  </span>
                </div>
                <button onClick={() => setIsAdding('closedLost')} className="text-slate-400 font-bold hover:text-slate-600 tracking-widest leading-none">...</button>
              </div>
              <div className="space-y-3 relative">
                <AnimatePresence mode="popLayout">
                  {lists.closedLost.map(card => renderCard(card, 'closedLost'))}
                </AnimatePresence>
                {lists.closedLost.length === 0 && searchQuery && <div className="py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matches</div>}
              </div>
            </div>

          </div>
        )}
      </div>
      
      {/* Trash Bin */}
      <motion.div 
        id="trash-bin"
        animate={{ 
          scale: isOverTrash ? 1.3 : 1,
          x: isOverTrash ? [-1, 1, -1, 1, 0] : 0,
        }}
        transition={{
          x: { repeat: Infinity, duration: 0.2 },
          scale: { type: "spring", stiffness: 300, damping: 20 }
        }}
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex justify-center items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-[2.5px] border-dashed transition-colors duration-300 z-[100] group overflow-hidden ${isOverTrash ? 'border-red-500 bg-red-50' : 'border-red-300'}`}
      >
        <div className={`absolute inset-0 bg-red-100 transition-opacity ${isOverTrash ? 'opacity-40' : 'opacity-0'}`}></div>
        <svg className={`w-6 h-6 relative pointer-events-none transition-all duration-300 z-10 ${isOverTrash ? 'text-red-600 rotate-12 scale-110' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full border border-gray-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex justify-center items-center mb-6">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold text-[#0e4d46] mb-2">Delete Lead?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-[#0e4d46]">"{itemToDelete.company}"</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-6 py-3.5 rounded-xl border border-gray-200 text-slate-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Lead Modal (Mirroring Delete Modal Style) */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full border border-gray-100">
              <h3 className="text-xl font-extrabold text-[#0e4d46] mb-6">Add New Lead</h3>
              <form onSubmit={handleAddDeal} className="space-y-4">
                <input 
                  autoFocus required placeholder="Company Name" 
                  className="w-full px-4 py-3 bg-[#f8fafb] rounded-xl border border-gray-100 font-bold text-sm"
                  value={newDealTitle} onChange={e => setNewDealTitle(e.target.value)}
                />
                <input 
                  required type="number" placeholder="Deal Value (₹)" 
                  className="w-full px-4 py-3 bg-[#f8fafb] rounded-xl border border-gray-100 font-bold text-sm"
                  value={newDealValue} onChange={e => setNewDealValue(e.target.value)}
                />
                <select 
                  className="w-full px-4 py-3 bg-[#f8fafb] rounded-xl border border-gray-100 font-bold text-sm appearance-none"
                  value={newDealPriority} onChange={e => setNewDealPriority(e.target.value)}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <select 
                  className="w-full px-4 py-3 bg-[#f8fafb] rounded-xl border border-gray-100 font-bold text-sm appearance-none"
                  value={newDealResult} onChange={e => setNewDealResult(e.target.value)}
                >
                  <option value="">Select Result (Optional)</option>
                  <option value="WON">WON</option>
                  <option value="LOST">LOST</option>
                </select>

                <select 
                  className="w-full px-4 py-3 bg-[#f8fafb] rounded-xl border border-gray-100 font-bold text-sm appearance-none"
                  value={newDealLeadSource} onChange={e => setNewDealLeadSource(e.target.value)}
                >
                  <option value="DIRECT">Direct Search</option>
                  <option value="PAID">Paid Campaigns</option>
                  <option value="REFERRAL">Referrals</option>
                  <option value="SOCIAL">Social Media</option>
                </select>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAdding(null)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-bold text-sm text-slate-600">Cancel</button>
                  <button type="submit" className="flex-1 py-3 px-4 rounded-xl bg-[#0e4d46] text-white font-bold text-sm shadow-lg shadow-teal-900/10">Add</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MyPipeline;
