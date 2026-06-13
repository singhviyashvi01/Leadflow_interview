import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCalendarEvents, createCalendarEvent, fetchUsers, updateCalendarEvent, deleteCalendarEvent } from '../services/calendarService';
import { fetchPipelineData } from '../services/pipelineService';
import { motion, AnimatePresence } from 'framer-motion';

const getDateTimeParts = (value) => {
  const date = new Date(value);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
};

const formatTime = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getDateKey = (value) => {
  const { year, month, day } = getDateTimeParts(value);
  return `${year}-${month}-${day}`;
};

const buildIsoFromDateTime = (dateString, timeString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0).toISOString();
};

// Time format converters
const convertTo12Hour = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// TimePicker component
const TimePicker = ({ value, onChange, disabled, format }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempHour, setTempHour] = useState(parseInt(value?.split(':')[0] || '10', 10));
  const [tempMinute, setTempMinute] = useState(parseInt(value?.split(':')[1] || '00', 10));

  // Display value based on format
  const getDisplayValue = () => {
    const timeIn24h = value || '10:00';
    return format === '12h' ? convertTo12Hour(timeIn24h) : timeIn24h;
  };

  // When in 24-hour mode, prefer a typing-based input rather than the clock UI
  if (format === '24h') {
    return (
      <input
        type="time"
        value={value || '10:00'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-fit bg-white px-4 py-2 border-none rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none disabled:bg-gray-100 disabled:text-gray-400"
      />
    );
  }

  const handleClockClick = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const angle = Math.atan2(clickY - centerY, clickX - centerX);
    const normalizedAngle = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    const slot = Math.round((normalizedAngle / (Math.PI * 2)) * 12) % 12;

    // Determine if we're selecting hour or minute based on distance from center
    const distance = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
    const isMinute = distance < 72; // Inner ring (65px radius) for minutes
    const isHour = distance >= 72;   // Outer ring (75-85px radius) for hours

    if (isMinute) {
      setTempMinute((slot * 5) % 60);
    } else if (isHour) {
      // Always work with 24-hour format internally
      setTempHour(slot);
    }
  };

  const handleConfirm = () => {
    // Always save in 24-hour format
    const newTime = `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
    onChange(newTime);
    setIsOpen(false);
  };

  const handleOpenClick = () => {
    if (!disabled) {
      // Sync temp values with current value when opening
      const [h, m] = (value || '10:00').split(':').map(Number);
      setTempHour(h);
      setTempMinute(m);
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpenClick}
        disabled={disabled}
        className="w-fit bg-white px-4 py-2 border-none rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer"
      >
        {getDisplayValue()}
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          {/* Clock face */}
          <div
            onClick={handleClockClick}
            className="w-48 h-48 border-2 border-[#0e4d46] rounded-full relative cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100"
          >
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#0e4d46] rounded-full transform -translate-x-1/2 -translate-y-1/2" />

            {/* Hour markers (0-23 or 1-12 depending on format) */}
            {Array.from({ length: format === '12h' ? 12 : 24 }).map((_, i) => {
              const displayNum = format === '12h' ? (i === 0 ? 12 : i) : i;
              const angle = (i / (format === '12h' ? 12 : 24)) * Math.PI * 2 - Math.PI / 2;
              const radius = format === '12h' ? 85 : 75;
              const x = Math.cos(angle) * radius + 96;
              const y = Math.sin(angle) * radius + 96;
              const isSelected = format === '12h' 
                ? (i === 0 ? tempHour === 0 || tempHour === 12 : tempHour === i)
                : tempHour === i;
              return (
                <div
                  key={`hour-${i}`}
                  className={`absolute w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${
                    isSelected 
                      ? 'bg-[#0e4d46] text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ left: `${x - 12}px`, top: `${y - 12}px` }}
                >
                  {displayNum}
                </div>
              );
            })}

            {/* Minute markers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(angle) * 65 + 96;
              const y = Math.sin(angle) * 65 + 96;
              const minuteVal = (i * 5) % 60;
              const isSelected = tempMinute === minuteVal;
              return (
                <div
                  key={`minute-${i}`}
                  className={`absolute w-2 h-2 rounded-full ${
                    isSelected ? 'bg-[#0e4d46]' : 'bg-gray-300'
                  }`}
                  style={{ left: `${x}px`, top: `${y}px` }}
                />
              );
            })}

            {/* Hour hand */}
            <div
              className="absolute w-1 h-12 bg-[#0e4d46] rounded-full origin-bottom"
              style={{
                left: '50%',
                bottom: '50%',
                transform: `translateX(-50%) rotate(${(tempHour / (format === '12h' ? 12 : 24)) * 360}deg)`,
              }}
            />

            {/* Minute hand */}
            <div
              className="absolute w-0.5 h-16 bg-[#a3c2c0] rounded-full origin-bottom"
              style={{
                left: '50%',
                bottom: '50%',
                transform: `translateX(-50%) rotate(${(tempMinute / 60) * 360}deg)`,
              }}
            />
          </div>

          {/* Time display and controls */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <div className="text-xs font-bold text-gray-500 mb-1">Time</div>
              <div className="text-lg font-bold text-[#0e4d46]">
                {format === '12h' 
                  ? convertTo12Hour(`${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`)
                  : `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`
                }
              </div>
            </div>
          </div>

          {/* Confirm/Cancel buttons */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-[#0e4d46] text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-[#0a3a37] transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Separate View Components for better scope and debugging
const YearView = ({ fYear, today, getCalendarInfo }) => {
  const months = Array.from({ length: 12 }, (_, i) => new Date(fYear, i, 1));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
      {months.map((m, idx) => {
        const { firstDay, daysIn } = getCalendarInfo(m);
        const dates = [];
        for (let i = 0; i < firstDay; i++) dates.push(null);
        for (let i = 1; i <= daysIn; i++) dates.push(i);
        return (
          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="text-xs font-bold text-[#0e4d46] mb-4 text-center">{m.toLocaleString('default', { month: 'long' }).toUpperCase()}</h4>
            <div className="grid grid-cols-7 gap-1 text-[8px] text-center font-bold text-gray-400 mb-2">
              {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-[8px] text-center">
              {dates.map((d, i) => (
                <div key={i} className={`h-4 flex items-center justify-center font-semibold ${d === today.getDate() && idx === today.getMonth() && fYear === today.getFullYear() ? 'bg-[#0e4d46] text-white rounded-full' : 'text-[#0e4d46]'}`}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DayView = ({ selectedDayFull, fullViewDate, fYear, events }) => {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
  const dayEvents = events[selectedDayFull] || [];
  const monthName = fullViewDate.toLocaleString('default', { month: 'long' });
  return (
    <div className="flex-1 p-8 relative min-h-[600px] bg-white">
      <h4 className="text-sm font-bold text-[#0e4d46] mb-8">{selectedDayFull} {monthName} {fYear}</h4>
      <div className="space-y-0 relative">
        {hours.map(h => (
          <div key={h} className="flex border-t border-gray-100 h-20 items-start">
            <span className="text-[10px] font-bold text-[#5a827d] w-16 -mt-2">{h > 12 ? `${h-12} PM` : h === 12 ? '12 PM' : `${h} AM`}</span>
            <div className="flex-1 h-full relative">
              {dayEvents.filter(e => e.hour === h).map((event, i) => (
                <div key={i} className="absolute left-2 right-2 top-2 p-4 bg-[#0e4d46] text-white rounded-xl shadow-md z-10 animate-in slide-in-from-left-2 duration-300 cursor-pointer">
                  <p className="text-xs font-bold mb-1">{event.title}</p>
                  <p className="text-[10px] opacity-80">{event.time} • {event.location}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeekView = ({ fullViewDate, today, allApiEvents, setFullViewDate, setSelectedDayFull, onEventDragStart, onDayDrop, dragOverKey, setDragOverKey }) => {
  const startOfWeek = new Date(fullViewDate);
  startOfWeek.setDate(fullViewDate.getDate() - fullViewDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const eventsByDate = {};
  allApiEvents.forEach((ev) => {
    const key = getDateKey(ev.start_time);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  });

  return (
    <div className="flex-1 bg-white">
      <div className="grid grid-cols-7 border-b border-gray-50">
        {weekDays.map((date) => {
          const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          const dayEvents = eventsByDate[key] || [];
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
          const isSelected =
            date.getDate() === fullViewDate.getDate() &&
            date.getMonth() === fullViewDate.getMonth() &&
            date.getFullYear() === fullViewDate.getFullYear();

          return (
            <div
              key={key}
              onClick={() => {
                setFullViewDate(date);
                setSelectedDayFull(date.getDate());
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverKey(key);
              }}
              onDragLeave={() => setDragOverKey((prev) => (prev === key ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                onDayDrop(date);
                setDragOverKey(null);
              }}
              className={`min-h-[520px] border-r border-gray-50 p-3 cursor-pointer transition-all ${dragOverKey === key ? 'bg-[#e8f3f1] ring-2 ring-inset ring-[#0e4d46]/25' : isSelected ? 'bg-[#f0f7f6]' : 'hover:bg-gray-50'}`}
            >
              <div className="mb-3">
                <p className="text-[10px] font-bold tracking-widest text-[#5a827d] uppercase">{date.toLocaleDateString('default', { weekday: 'short' })}</p>
                <p className={`mt-1 text-lg font-extrabold ${isToday ? 'text-white bg-[#0e4d46] w-8 h-8 rounded-full flex items-center justify-center' : 'text-[#0e4d46]'}`}>
                  {date.getDate()}
                </p>
              </div>

              <div className="space-y-2">
                {dayEvents.slice(0, 6).map((event) => {
                  const start = new Date(event.start_time);
                  const end = new Date(event.end_time);
                  const time = event.all_day
                    ? 'All day'
                    : `${formatTime(start)} - ${formatTime(end)}`;

                  return (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={() => onEventDragStart(event.id)}
                      className="rounded-lg px-2 py-2 cursor-move shadow-sm transition-transform hover:scale-[1.02]"
                      style={{ 
                        backgroundColor: event.color || '#0e4d46',
                        color: 'white',
                        borderLeft: `4px solid rgba(0,0,0,0.2)`
                      }}
                    >
                      <p className="text-[11px] font-bold truncate">{event.title}</p>
                      <p className={`text-[10px] ${event.event_type === 'meeting' ? 'text-white/80' : 'text-[#5a827d]'}`}>{time}</p>
                      {(event.linkedDealTitle || event.linkedLeadName) && (
                        <p className={`text-[9px] mt-1 truncate ${event.event_type === 'meeting' ? 'text-white/70' : 'text-[#5a827d]'}`}>
                          {event.linkedDealTitle || event.linkedLeadName}
                        </p>
                      )}
                    </div>
                  );
                })}
                {dayEvents.length > 6 && (
                  <p className="text-[10px] font-bold text-[#5a827d] pl-1">+{dayEvents.length - 6} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthView = ({ fYear, fMonth, fFirstDay, fDaysIn, events, selectedDayFull, setSelectedDayFull, today, daysOfWeek, onEventDragStart, onDayDrop, dragOverKey, setDragOverKey }) => {
  const datesFull = [];
  const prevMonthLastDay = new Date(fYear, fMonth, 0).getDate();
  for (let i = fFirstDay - 1; i >= 0; i--) datesFull.push({ day: prevMonthLastDay - i, currentMonth: false });
  for (let i = 1; i <= fDaysIn; i++) datesFull.push({ day: i, currentMonth: true });
  const remainingCells = 42 - datesFull.length;
  for (let i = 1; i <= remainingCells; i++) datesFull.push({ day: i, currentMonth: false });

  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-7 border-b border-gray-50">
        {daysOfWeek.map(day => <div key={day} className="py-4 text-center text-[10px] font-bold text-[#5a827d] tracking-widest uppercase">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {datesFull.map((date, index) => {
          const dayEvents = date.currentMonth ? events[date.day] || [] : [];
          const cellKey = date.currentMonth ? `${fYear}-${fMonth + 1}-${date.day}` : `inactive-${index}`;
          const isSelected = date.currentMonth && date.day === selectedDayFull;
          const isToday = date.day === today.getDate() && fMonth === today.getMonth() && fYear === today.getFullYear() && date.currentMonth;
          return (
            <div
              key={index}
              onClick={() => date.currentMonth && setSelectedDayFull(date.day)}
              onDragOver={(e) => {
                if (!date.currentMonth) return;
                e.preventDefault();
                setDragOverKey(cellKey);
              }}
              onDragLeave={() => setDragOverKey((prev) => (prev === cellKey ? null : prev))}
              onDrop={(e) => {
                if (!date.currentMonth) return;
                e.preventDefault();
                onDayDrop(new Date(fYear, fMonth, date.day));
                setDragOverKey(null);
              }}
              className={`min-h-[120px] p-2 border-r border-b border-gray-50 last:border-r-0 transition-all cursor-pointer hover:bg-gray-50 ${!date.currentMonth ? 'bg-gray-50/30' : ''} ${dragOverKey === cellKey ? 'bg-[#e8f3f1] ring-2 ring-inset ring-[#0e4d46]/25' : isSelected ? 'ring-2 ring-inset ring-[#0e4d46] bg-[#f0f7f6]' : ''}`}
            >
              <div className="flex justify-between items-center px-1">
                <span className={`text-xs font-extrabold ${date.currentMonth ? (isToday ? 'bg-[#0e4d46] text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-[#0e4d46]') : 'text-gray-300'}`}>{date.day}</span>
                {dayEvents.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#0e4d46]/40"></span>}
              </div>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map((event, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => onEventDragStart(event.id)}
                    className="px-2 py-1.5 rounded-md text-[9px] font-bold truncate transition-all cursor-move shadow-sm"
                    style={{ 
                      backgroundColor: event.color || '#0e4d46',
                      color: 'white'
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <p className="text-[8px] font-bold text-[#5a827d] pl-2">+{dayEvents.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const REMINDER_OPTIONS = [
  { label: '10 minutes before', value: 10 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
];

const mapApiMiniTasks = (apiEvents) => {
  const tasks = {};
  apiEvents.forEach((ev) => {
    const key = getDateKey(ev.start_time);
    if (!tasks[key]) tasks[key] = [];
    tasks[key].push(ev.title);
  });
  return tasks;
};

const buildDealOptions = (pipelineData) => {
  if (!pipelineData || !Array.isArray(pipelineData.pipeline)) return [];

  return pipelineData.pipeline.flatMap((stage) => {
    if (!Array.isArray(stage.deals)) return [];

    return stage.deals.map((deal) => ({
      id: deal.id,
      label: `${deal.company || deal.title} — ${deal.title}`,
      leadId: deal.lead_id,
      leadName: deal.lead_name || '',
      company: deal.company || '',
    }));
  });
};

const EVENT_COLORS = [
  { label: 'Deep Teal', value: '#0e4d46' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amethyst', value: '#8b5cf6' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Sky', value: '#0ea5e9' },
];

const CreateEventView = ({ onSave, onCancel, onDelete, initialData, dealOptions }) => {
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title || '');

  // Helper: get today's date as YYYY-MM-DD in local time (not UTC)
  const localToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [startDate, setStartDate] = useState(initialData?.startDate || localToday());
  const [endDate, setEndDate] = useState(initialData?.endDate || localToday());
  const [startTime, setStartTime] = useState(initialData?.startTime || '10:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '11:00');
  const [allDay, setAllDay] = useState(initialData?.allDay ?? false);
  const [timeFormat, setTimeFormat] = useState('24h');
  const [location, setLocation] = useState(initialData?.location || '');
  const [meetingLink, setMeetingLink] = useState(initialData?.meetingLink || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedDealId, setSelectedDealId] = useState(initialData?.deal ? String(initialData.deal) : '');
  const [selectedLeadId, setSelectedLeadId] = useState(initialData?.lead ? String(initialData.lead) : '');
  const [color, setColor] = useState(initialData?.color || '#0e4d46');
  const [eventType, setEventType] = useState(initialData?.event_type || 'meeting');

  // Attendees — pre-fill from initialData
  const [guestQuery, setGuestQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedAttendees, setSelectedAttendees] = useState(initialData?.attendees || []);

  // Guest permissions — pre-fill from initialData
  const [canInvite, setCanInvite] = useState(initialData?.permissions?.canInvite ?? true);
  const [canSeeList, setCanSeeList] = useState(initialData?.permissions?.canSeeList ?? true);
  const [canModify, setCanModify] = useState(initialData?.permissions?.canModify ?? false);

  // Reminders — pre-fill from initialData
  const [reminders, setReminders] = useState(
    Array.isArray(initialData?.reminders) && initialData.reminders.length > 0
      ? initialData.reminders
      : [30]
  );

  useEffect(() => {
    if (!guestQuery.trim()) { return; }
    const t = setTimeout(async () => {
      try {
        const results = await fetchUsers(guestQuery);
        setUserResults(results.filter(u => !selectedAttendees.find(a => a.id === u.id)));
      } catch { setUserResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [guestQuery, selectedAttendees]);

  const [recurrence, setRecurrence] = useState(initialData?.recurrence || { frequency: 'none' });

  useEffect(() => {
    if (!selectedDealId) return;
    const matchedDeal = dealOptions.find((deal) => String(deal.id) === selectedDealId);
    if (matchedDeal?.leadId && String(matchedDeal.leadId) !== selectedLeadId) {
      setSelectedLeadId(String(matchedDeal.leadId));
    }
  }, [dealOptions, selectedDealId]);

  const addAttendee = (user) => {
    setSelectedAttendees(prev => [...prev, user]);
    setGuestQuery('');
    setUserResults([]);
  };

  const removeAttendee = (id) => {
    setSelectedAttendees(prev => prev.filter(a => a.id !== id));
  };

  const addReminder = () => {
    const unused = REMINDER_OPTIONS.find(o => !reminders.includes(o.value));
    if (unused) setReminders(prev => [...prev, unused.value]);
  };

  const removeReminder = (val) => {
    setReminders(prev => prev.filter(r => r !== val));
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Timing Validation
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end <= start) {
      alert('Senseless timings! The event must end after it starts.');
      return;
    }

    onSave({
      title: title || 'Untitled Event',
      startDate,
      endDate,
      startTime: allDay ? '00:00' : startTime,
      endTime: allDay ? '23:59' : endTime,
      allDay,
      location,
      meetingLink,
      description,
      attendeeIds: selectedAttendees.map(a => a.id),
      permissions: { canInvite, canSeeList, canModify },
      reminders,
      recurrence,
      dealId: selectedDealId ? Number(selectedDealId) : null,
      leadId: selectedLeadId ? Number(selectedLeadId) : null,
      color,
      eventType,
    });
  };

  return (
    <div className="flex w-full bg-transparent pt-4">
      {/* Left Form Area */}
      <div className="flex-1 flex flex-col pl-8 pr-16 pb-8 space-y-8">
        
        <div className="flex items-center gap-6 mt-4">
          <input 
            type="text" 
            placeholder="Add title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-4xl font-bold text-[#0e4d46] placeholder:text-[#a3c2c0] border-none outline-none focus:ring-0 px-0"
          />
          <div className="flex items-center gap-2">
            {EVENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value ? 'border-[#0e4d46] scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-start gap-4 text-[#5a827d]">
          {/* Clock Icon */}
          <div className="mt-2 text-[#a3c2c0]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div className="flex flex-col space-y-3 flex-1">
            <div className="flex items-center gap-4">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-fit bg-white px-4 py-2 border-none rounded-xl text-sm font-bold text-[#0e4d46] shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none cursor-pointer"
              >
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="reminder">Reminder</option>
                <option value="other">Other</option>
              </select>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-fit bg-white px-4 py-2 border-none rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none" placeholder="DD/MM/YYYY" />
              <TimePicker value={startTime} onChange={setStartTime} disabled={allDay} format={timeFormat} />
              <span className="text-gray-400 font-bold">—</span>
              <TimePicker value={endTime} onChange={setEndTime} disabled={allDay} format={timeFormat} />
              <button
                type="button"
                onClick={() => setTimeFormat(timeFormat === '24h' ? '12h' : '24h')}
                className="ml-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 transition-colors"
                title="Toggle time format"
              >
                {timeFormat === '24h' ? '24h' : '12h'}
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-fit bg-white px-4 py-2 border-none rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none" placeholder="DD/MM/YYYY" />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded border-gray-300 text-[#0e4d46] focus:ring-[#0e4d46] w-4 h-4 cursor-pointer" />
                <span className="text-sm font-bold text-gray-600">All day</span>
              </label>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-4 text-[#5a827d]">
          <div className="text-[#a3c2c0]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Add location" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 bg-white px-4 py-3 border-none rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-400 shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none"
          />
        </div>

        {/* Meeting Link */}
        <div className="flex items-center gap-4 text-[#5a827d]">
          <div className="text-[#a3c2c0]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m11.156-1.5a4 4 0 010 5.656l-1.5 1.5m-5.656-11.156a4 4 0 015.656 0l3 3a4 4 0 01-5.656 5.656l-1.5-1.5" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Add meeting link"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            className="flex-1 bg-white px-4 py-3 border-none rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-400 shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none"
          />
        </div>

        {/* Linked CRM Record */}
        <div className="flex items-start gap-4 text-[#5a827d]">
          <div className="mt-2 text-[#a3c2c0]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m11.156-1.5a4 4 0 010 5.656l-1.5 1.5m-5.656-11.156a4 4 0 015.656 0l3 3a4 4 0 01-5.656 5.656l-1.5-1.5" />
            </svg>
          </div>
          <div className="flex-1 space-y-3">
            <select
              value={selectedDealId}
              onChange={(e) => {
                const nextDealId = e.target.value;
                setSelectedDealId(nextDealId);
                const matchedDeal = dealOptions.find((deal) => String(deal.id) === nextDealId);
                setSelectedLeadId(matchedDeal?.leadId ? String(matchedDeal.leadId) : '');
              }}
              className="w-full bg-white px-4 py-3 border-none rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-400 shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none"
            >
              <option value="">Link to a deal (optional)</option>
              {dealOptions.map((deal) => (
                <option key={deal.id} value={String(deal.id)}>{deal.label}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
              <span className="px-3 py-1 rounded-full bg-[#f0f7f6] text-[#0e4d46]">
                Lead: {selectedLeadId || 'Not linked'}
              </span>
            </div>
          </div>
        </div>

        {/* Description / Attachments */}
        <div className="flex items-start gap-4 text-[#5a827d]">
          <div className="mt-3 text-[#a3c2c0]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <textarea 
            placeholder="Add description or attachments" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="6"
            className="flex-1 bg-white px-4 py-3 border-none rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-400 shadow-sm focus:ring-2 focus:ring-[#0e4d46]/20 outline-none resize-none"
          />
        </div>

        {/* Notification */}
        <div className="flex items-center gap-4 text-[#5a827d] pt-2">
          <div className="text-[#a3c2c0] opacity-0"><svg className="w-5 h-5" /></div>
          <div className="flex flex-col space-y-3">
            {reminders.map((val) => {
              const opt = REMINDER_OPTIONS.find(o => o.value === val);
              return (
                <div key={val} className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>{opt ? opt.label : `${val} minutes before`}</span>
                  <button type="button" onClick={() => removeReminder(val)} className="text-gray-400 hover:text-gray-600 ml-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={addReminder} className="text-sm font-bold text-[#0e4d46] hover:underline flex items-center gap-1 w-fit">
              + Add notification
            </button>
          </div>
        </div>

      </div>

      {/* Right Sidebar */}
      <div className="w-[320px] bg-[#f8fafb] rounded-[24px] border border-gray-100/50 shadow-sm flex flex-col overflow-hidden mb-8 mr-8">
        
        <div className="p-6 flex-1">
          {/* Attendees Section */}
          <div className="mb-8">
            <h4 className="text-xs font-bold text-[#0e4d46] uppercase tracking-widest mb-4">Attendees</h4>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Add guests"
                value={guestQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setGuestQuery(value);
                  if (!value.trim()) setUserResults([]);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200/60 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0e4d46]/20 shadow-sm"
              />
              {userResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  {userResults.map(u => {
                    const name = `${u.first_name} ${u.last_name}`.trim() || u.email;
                    const initials = `${(u.first_name || '')[0] || ''}${(u.last_name || '')[0] || ''}`.toUpperCase() || '?';
                    return (
                      <button key={u.id} type="button" onClick={() => addAttendee(u)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f7f6] transition-colors text-left">
                        <div className="w-7 h-7 rounded-full bg-[#e8f3f1] flex items-center justify-center text-[10px] font-bold text-[#0e4d46] shrink-0">{initials}</div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-[#0e4d46] truncate">{name}</span>
                          <span className="text-[10px] text-gray-400 truncate">{u.email}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {selectedAttendees.map(u => {
                const name = `${u.first_name} ${u.last_name}`.trim() || u.email;
                const initials = `${(u.first_name || '')[0] || ''}${(u.last_name || '')[0] || ''}`.toUpperCase() || '?';
                return (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">{initials}</div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-[#0e4d46] truncate">{name}</span>
                      <span className="text-[10px] font-semibold text-gray-400">Guest</span>
                    </div>
                    <button type="button" onClick={() => removeAttendee(u.id)} className="text-gray-300 hover:text-gray-500 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 mb-8"></div>

          {/* Guest Permissions Section */}
          <div>
            <h4 className="text-[10px] font-bold text-[#5a827d] uppercase tracking-widest mb-4">Guest Permissions</h4>
            <div className="space-y-3 bg-transparent">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={canInvite} onChange={e => setCanInvite(e.target.checked)} className="rounded border-gray-300 text-[#0e4d46] focus:ring-[#0e4d46] w-4 h-4 cursor-pointer" />
                <span className="text-xs font-semibold text-gray-600">Invite others</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={canSeeList} onChange={e => setCanSeeList(e.target.checked)} className="rounded border-gray-300 text-[#0e4d46] focus:ring-[#0e4d46] w-4 h-4 cursor-pointer" />
                <span className="text-xs font-semibold text-gray-600">See guest list</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={canModify} onChange={e => setCanModify(e.target.checked)} className="rounded border-gray-300 text-[#0e4d46] focus:ring-[#0e4d46] w-4 h-4 cursor-pointer" />
                <span className="text-xs font-semibold text-gray-600">Modify event</span>
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <h4 className="text-xs font-bold text-[#5a827d] uppercase tracking-widest mb-3">Recurrence</h4>
          <div className="mb-4">
            <select value={recurrence.frequency} onChange={(e) => setRecurrence({ ...recurrence, frequency: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-[#0e4d46] bg-white">
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#eef6f4] text-[#0e4d46] hover:bg-[#e0f0ed] transition-colors">
              Cancel
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            )}
            <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-black text-white shadow-lg hover:bg-gray-800 transition-colors">
              {isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

const Calendar = ({ variant = 'mini' }) => {
  const navigate = useNavigate();
  const today = new Date();
  
  // States
  const [miniViewDate, setMiniViewDate] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [miniTasks, setMiniTasks] = useState({});
  const [fullViewDate, setFullViewDate] = useState(today);
  const [selectedDayFull, setSelectedDayFull] = useState(today.getDate());
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // holds the event object being edited
  const [selectedEventIdx, setSelectedEventIdx] = useState(0); // which event on the selected day
  const [view, setView] = useState('Month');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAttendee, setFilterAttendee] = useState('all');
  const [filterColor, setFilterColor] = useState('all');
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [draggingEventId, setDraggingEventId] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [dealOptions, setDealOptions] = useState([]);

  const dealLookup = dealOptions.reduce((acc, deal) => {
    acc[String(deal.id)] = deal;
    return acc;
  }, {});

  // Map API events array → { [dayOfMonth]: [eventObj, ...] } keyed to fullViewDate month/year
  const mapApiEvents = (apiEvents, refDate) => {
    const mapped = {};
    apiEvents.forEach(ev => {
      const startParts = getDateTimeParts(ev.start_time);
      const endParts = getDateTimeParts(ev.end_time);
      // Only include events in the currently viewed month/year
      if (startParts.year !== refDate.getFullYear() || startParts.month - 1 !== refDate.getMonth()) return;
      const day = startParts.day;
      const hour = startParts.hour;
      const fmt = (value) => formatTime(value);
      const attendees = (ev.attendees || []).map(a => ({
        // Keep full API shape so edit form can send attendee_ids correctly
        id: a.id,
        first_name: a.first_name || '',
        last_name: a.last_name || '',
        email: a.email || '',
        // Derived display fields
        name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email,
        initials: `${(a.first_name || '')[0] || ''}${(a.last_name || '')[0] || ''}`.toUpperCase() || '?',
      }));
      if (!mapped[day]) mapped[day] = [];
      mapped[day].push({
        id: ev.id,
        title: ev.title,
        time: ev.all_day ? 'All day' : `${fmt(ev.start_time)} - ${fmt(ev.end_time)}`,
        allDay: !!ev.all_day,
        location: ev.location || '',
        meetingLink: ev.meeting_link || '',
        description: ev.description || '',
        attendees,
        type: ev.event_type === 'meeting' ? 'primary' : 'secondary',
        hour,
        permissions: ev.permissions || {},
        reminders: Array.isArray(ev.reminders) ? ev.reminders : [],
        recurrence: ev.recurrence || {},
        color: ev.color || '#0e4d46',
        lead: ev.lead || null,
        deal: ev.deal || null,
        linkedLeadName: ev.lead_name || '',
        linkedDealTitle: ev.deal_title || '',
        linkedDealCompany: ev.deal_company || '',
        // Keep raw date/time strings for edit pre-fill
        startDate: `${startParts.year}-${String(startParts.month).padStart(2,'0')}-${String(startParts.day).padStart(2,'0')}`,
        endDate: `${endParts.year}-${String(endParts.month).padStart(2,'0')}-${String(endParts.day).padStart(2,'0')}`,
        startTime: `${String(startParts.hour).padStart(2,'0')}:${String(startParts.minute).padStart(2,'0')}`,
        endTime: `${String(endParts.hour).padStart(2,'0')}:${String(endParts.minute).padStart(2,'0')}`,
      });
    });
    return mapped;
  };

  // Map API events → miniTasks { "YYYY-M-D": [title, ...] }
  const [allApiEvents, setAllApiEvents] = useState([]);

  const attendeeFilterOptions = Array.from(
    allApiEvents
      .flatMap((ev) => ev.attendees || [])
      .reduce((acc, attendee) => {
        if (!attendee?.id) return acc;
        if (!acc.has(attendee.id)) {
          const name = `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim() || attendee.email || `User ${attendee.id}`;
          acc.set(attendee.id, { id: attendee.id, name });
        }
        return acc;
      }, new Map())
      .values()
  );

  const getFilteredApiEvents = (apiEvents) => {
    const q = searchQuery.trim().toLowerCase();
    return apiEvents.filter((ev) => {
      const matchesType = filterType === 'all' || ev.event_type === filterType;
      const matchesAttendee =
        filterAttendee === 'all' ||
        (ev.attendees || []).some((a) => String(a.id) === filterAttendee);
      const matchesColor = filterColor === 'all' || ev.color === filterColor;

      const textBlob = [
        ev.title,
        ev.description,
        ev.location,
        ev.meeting_link,
        ...(ev.attendees || []).map((a) => `${a.first_name || ''} ${a.last_name || ''} ${a.email || ''}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !q || textBlob.includes(q);
      return matchesType && matchesAttendee && matchesColor && matchesSearch;
    });
  };

  const filteredApiEvents = getFilteredApiEvents(allApiEvents);
  const events = mapApiEvents(filteredApiEvents, fullViewDate);

  const loadEvents = useCallback(async () => {
    try {
      const data = await fetchCalendarEvents();
      setAllApiEvents(data);
      setMiniTasks(mapApiMiniTasks(data));
    } catch (err) {
      console.error('Failed to load calendar events', err);
    }
  }, []);

  const loadDealOptions = useCallback(async () => {
    try {
      const data = await fetchPipelineData();
      setDealOptions(buildDealOptions(data));
    } catch (err) {
      console.error('Failed to load deal options', err);
      setDealOptions([]);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadDealOptions();
  }, [loadDealOptions]);

  const getCalendarInfo = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysIn = new Date(year, month + 1, 0).getDate();
    return { month, year, firstDay, daysIn };
  };

  const daysOfWeek = variant === 'mini' 
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const selectedDayEvents = events[selectedDayFull] || [];
  // Reset to first event whenever the selected day changes
  useEffect(() => { setSelectedEventIdx(0); }, [selectedDayFull]);
  const activeEvent = selectedDayEvents[selectedEventIdx] || selectedDayEvents[0];
  const meetingHref = activeEvent?.meetingLink
    ? (activeEvent.meetingLink.startsWith('http://') || activeEvent.meetingLink.startsWith('https://')
      ? activeEvent.meetingLink
      : `https://${activeEvent.meetingLink}`)
    : '';

  if (variant === 'mini') {
    const { month, year, firstDay, daysIn } = getCalendarInfo(miniViewDate);
    const monthNameArr = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const monthName = monthNameArr[month];
    const prevMonth = () => setMiniViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setMiniViewDate(new Date(year, month + 1, 1));
    const getDateString = (day) => `${year}-${month + 1}-${day}`;
    const dates = [];
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let i = 1; i <= daysIn; i++) dates.push(i);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-fit"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-[#0e4d46] tracking-wider">{monthName} {year}</h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-1.5 hover:bg-[#e8f3f1] rounded-lg transition-colors text-[#5a827d]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-[#e8f3f1] rounded-lg transition-colors text-[#5a827d]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center mb-6">
          {daysOfWeek.map(day => <span key={day} className="text-[10px] font-bold text-[#5a827d] uppercase pb-2">{day}</span>)}
          {dates.map((date, index) => {
            const dateStr = date ? getDateString(date) : null;
            const hasTasks = dateStr && miniTasks[dateStr]?.length > 0;
            const isToday = date && date === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = date === selectedDay;
            return date ? (
              <div key={index} className="flex flex-col items-center justify-center py-1">
                <button onClick={() => setSelectedDay(date)} className={`relative text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all ${isSelected ? 'bg-[#0e4d46] text-white shadow-lg' : isToday ? 'bg-[#e8f3f1] text-[#0e4d46]' : 'text-gray-600 hover:bg-gray-50'} ${hasTasks && !isSelected ? 'after:content-[""] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-[#0e4d46] after:rounded-full' : ''}`}>{date}</button>
              </div>
            ) : <div key={index}></div>;
          })}
        </div>
        <button onClick={() => navigate('/calendar')} className="w-full mb-6 py-3 bg-[#0e4d46] text-white rounded-xl text-xs font-bold hover:bg-[#0a3d37] transition-all shadow-sm">Show Full Calendar</button>
        <div className="flex flex-col pt-6 border-t border-gray-100">
          <h4 className="text-[10px] font-bold text-[#5a827d] uppercase tracking-widest mb-4">Tasks for {selectedDay} {miniViewDate.toLocaleString('default', { month: 'short' })}</h4>
          <div className="space-y-3">
            {(miniTasks[getDateString(selectedDay)] || []).map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#f8fafb] rounded-xl border border-gray-50 group hover:border-[#0e4d46]/20 transition-all"><div className="w-1.5 h-1.5 rounded-full bg-[#0e4d46] shrink-0"></div><p className="text-[11px] font-bold text-[#0e4d46] flex-1">{task}</p></div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const { month: fMonth, year: fYear, firstDay: fFirstDay, daysIn: fDaysIn } = getCalendarInfo(fullViewDate);
  const fMonthName = fullViewDate.toLocaleString('default', { month: 'long' });

  const handleNav = (direction) => {
    if (view === 'Day') {
      const newDate = new Date(fullViewDate);
      newDate.setDate(fullViewDate.getDate() + direction);
      setFullViewDate(newDate);
      setSelectedDayFull(newDate.getDate());
    } else if (view === 'Week') {
      const newDate = new Date(fullViewDate);
      newDate.setDate(fullViewDate.getDate() + (direction * 7));
      setFullViewDate(newDate);
      setSelectedDayFull(newDate.getDate());
    } else if (view === 'Month') {
      setFullViewDate(new Date(fYear, fMonth + direction, 1));
    } else if (view === 'Year') {
      setFullViewDate(new Date(fYear + direction, 0, 1));
    }
  };

  const getHeaderText = () => {
    if (view === 'Day') return fullViewDate.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });
    if (view === 'Week') {
      const weekStart = new Date(fullViewDate);
      weekStart.setDate(fullViewDate.getDate() - fullViewDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const sameMonth = weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear();

      if (sameMonth) {
        return `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('default', { month: 'long', year: 'numeric' })}`;
      }

      return `${weekStart.toLocaleDateString('default', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (view === 'Month') return fullViewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    if (view === 'Year') return fYear.toString();
    return '';
  };

  const handleEventDragStart = (eventId) => {
    setDraggingEventId(eventId);
  };

  const handleEventDropToDate = async (targetDate) => {
    if (!draggingEventId) return;

    const dragged = allApiEvents.find((ev) => ev.id === draggingEventId);
    if (!dragged) {
      setDraggingEventId(null);
      return;
    }

    const oldStart = new Date(dragged.start_time);
    const oldEnd = new Date(dragged.end_time);
    const durationMs = Math.max(oldEnd.getTime() - oldStart.getTime(), 0);
    const newStart = new Date(targetDate);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), oldStart.getSeconds(), 0);

    const newEnd = new Date(newStart.getTime() + durationMs);

    try {
      await updateCalendarEvent(dragged.id, {
        start_time: buildIsoFromDateTime(`${newStart.getFullYear()}-${String(newStart.getMonth() + 1).padStart(2, '0')}-${String(newStart.getDate()).padStart(2, '0')}`, `${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}`),
        end_time: buildIsoFromDateTime(`${newEnd.getFullYear()}-${String(newEnd.getMonth() + 1).padStart(2, '0')}-${String(newEnd.getDate()).padStart(2, '0')}`, `${String(newEnd.getHours()).padStart(2, '0')}:${String(newEnd.getMinutes()).padStart(2, '0')}`),
      });

      setFullViewDate(new Date(targetDate));
      setSelectedDayFull(targetDate.getDate());
      await loadEvents();
    } catch (err) {
      console.error('Failed to reschedule event', err);
      alert('Failed to reschedule event. Please try again.');
    } finally {
      setDraggingEventId(null);
    }
  };

  const handleTrashDrop = async (e) => {
    e.preventDefault();
    if (!draggingEventId) return;
    const dragged = allApiEvents.find((ev) => ev.id === draggingEventId);
    if (!dragged) return;

    if (window.confirm(`Delete "${dragged.title}"?`)) {
      try {
        await deleteCalendarEvent(dragged.id);
        await loadEvents();
      } catch (err) {
        console.error('Failed to delete event via trashcan', err);
      }
    }
    setDraggingEventId(null);
    setIsOverTrash(false);
  };

  if (isCreateViewOpen || editingEvent) {
    // Build initialData from editingEvent for pre-filling the form
    const initialData = editingEvent ? {
      title: editingEvent.title,
      startDate: editingEvent.startDate,
      endDate: editingEvent.endDate,
      startTime: editingEvent.startTime,
      endTime: editingEvent.endTime,
      allDay: editingEvent.allDay,
      location: editingEvent.location,
      meetingLink: editingEvent.meetingLink,
      description: editingEvent.description,
      attendees: editingEvent.attendees || [],
      permissions: editingEvent.permissions || {},
      reminders: editingEvent.reminders || [],
      lead: editingEvent.lead || null,
      deal: editingEvent.deal || null,
      color: editingEvent.color || '#0e4d46',
      event_type: editingEvent.event_type || 'meeting',
    } : null;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-[#eef6f4] min-h-screen relative"
      >
        <CreateEventView
          initialData={initialData}
          dealOptions={dealOptions}
          onSave={async ({ title, startDate, endDate, startTime, endTime, allDay, location, meetingLink, description, attendeeIds, permissions, reminders, recurrence, leadId, dealId, color, eventType }) => {
            try {
              const payload = {
                title: title || 'Untitled Event',
                start_time: buildIsoFromDateTime(startDate, startTime),
                end_time: buildIsoFromDateTime(endDate, endTime),
                all_day: !!allDay,
                location: location || '',
                meeting_link: meetingLink || '',
                description: description || '',
                event_type: eventType || 'meeting',
                attendee_ids: attendeeIds || [],
                permissions: permissions || {},
                reminders: reminders || [],
                lead: leadId || null,
                deal: dealId || null,
                color: color || '#0e4d46',
              };
              // include optional recurrence if provided
              if (recurrence) payload.recurrence = recurrence;
              if (editingEvent) {
                await updateCalendarEvent(editingEvent.id, payload);
              } else {
                await createCalendarEvent(payload);
              }
              await loadEvents();
              setIsCreateViewOpen(false);
              setEditingEvent(null);
            } catch (err) {
              console.error('Failed to save event', err);
              alert('Failed to save event. Please try again.');
            }
          }}
          onDelete={editingEvent ? async () => {
            if (!window.confirm(`Delete "${editingEvent.title}"? This cannot be undone.`)) return;
            try {
              await deleteCalendarEvent(editingEvent.id);
              await loadEvents();
              setEditingEvent(null);
            } catch (err) {
              console.error('Failed to delete event', err);
              alert('Failed to delete event. Please try again.');
            }
          } : undefined}
          />
      </motion.div>
    );
  }

  return (
    <div className="bg-[#f0f7f6] min-h-screen p-8 relative overflow-x-hidden pt-6">
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full w-full">
        <div className="p-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-50">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsCreateViewOpen(true)} className="bg-[#0e4d46] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#0a3d37] transition-all shadow-sm">
              <span className="text-xl leading-none">+</span> Create
            </button>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-extrabold text-[#0e4d46] min-w-[200px] text-center">{getHeaderText()}</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => handleNav(-1)} className="p-1 text-[#5a827d] hover:text-[#0e4d46]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={() => handleNav(1)} className="p-1 text-[#5a827d] hover:text-[#0e4d46]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
              </div>
              <button 
                onClick={() => { setFullViewDate(new Date()); setSelectedDayFull(new Date().getDate()); }} 
                className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-[#5a827d] hover:bg-gray-50 transition-all"
              >
                Today
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events"
                className="w-44 md:w-56 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-[#0e4d46] placeholder:text-[#9ab5b1] focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/20"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-[#0e4d46] bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/20"
              >
                <option value="all">All Types</option>
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="reminder">Reminder</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filterAttendee}
                onChange={(e) => setFilterAttendee(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-[#0e4d46] bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/20"
              >
                <option value="all">All Attendees</option>
                {attendeeFilterOptions.map((a) => (
                  <option key={a.id} value={String(a.id)}>{a.name}</option>
                ))}
              </select>
              <select
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-[#0e4d46] bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4d46]/20"
              >
                <option value="all">All Colors</option>
                {EVENT_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {(searchQuery || filterType !== 'all' || filterAttendee !== 'all' || filterColor !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterAttendee('all');
                    setFilterColor('all');
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-[#5a827d] hover:text-[#0e4d46] hover:border-[#0e4d46] transition-all"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex bg-[#f8fafb] p-1 rounded-xl">
              {['Day', 'Week', 'Month', 'Year'].map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${view === v ? 'bg-white text-[#0e4d46] shadow-sm' : 'text-[#5a827d] hover:text-[#0e4d46]'}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view + fullViewDate.getTime()}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'Year' ? <YearView fYear={fYear} today={today} getCalendarInfo={getCalendarInfo} /> : 
              view === 'Day' ? <DayView selectedDayFull={selectedDayFull} fullViewDate={fullViewDate} fYear={fYear} events={events} /> : 
              view === 'Week' ? <WeekView fullViewDate={fullViewDate} today={today} allApiEvents={filteredApiEvents} setFullViewDate={setFullViewDate} setSelectedDayFull={setSelectedDayFull} onEventDragStart={handleEventDragStart} onDayDrop={handleEventDropToDate} dragOverKey={dragOverKey} setDragOverKey={setDragOverKey} /> :
              <MonthView fYear={fYear} fMonth={fMonth} fFirstDay={fFirstDay} fDaysIn={fDaysIn} events={events} selectedDayFull={selectedDayFull} setSelectedDayFull={setSelectedDayFull} today={today} daysOfWeek={daysOfWeek} onEventDragStart={handleEventDragStart} onDayDrop={handleEventDropToDate} dragOverKey={dragOverKey} setDragOverKey={setDragOverKey} />}
          </motion.div>
        </AnimatePresence>

        {view !== 'Year' && (
          <div className="bg-[#f0f7f6] p-8 border-t border-gray-100 min-h-[300px]">
            <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col gap-3 min-w-0">
                <h3 className="text-xl font-extrabold text-[#0e4d46]">
                  {selectedDayEvents.length > 0 ? `Event Details: ${activeEvent.title}` : `No Events for ${selectedDayFull} ${fMonthName}`}
                </h3>
                {selectedDayEvents.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDayEvents.map((ev, idx) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEventIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all truncate max-w-[160px] ${idx === selectedEventIdx ? 'bg-[#0e4d46] text-white' : 'bg-white text-[#5a827d] border border-gray-200 hover:border-[#0e4d46] hover:text-[#0e4d46]'}`}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedDayEvents.length > 0 && (
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <button
                    onClick={() => setEditingEvent(activeEvent)}
                    className="border border-[#0e4d46] text-[#0e4d46] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#f0f7f6] transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => meetingHref && window.open(meetingHref, '_blank', 'noopener,noreferrer')}
                    disabled={!meetingHref}
                    className={`px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${meetingHref ? 'bg-[#0e4d46] text-white hover:bg-[#0a3d37]' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}
                  >
                    Join Meeting
                  </button>
                </div>
              )}
            </div>
            {selectedDayEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div><p className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest mb-2">TIME & DATE</p><p className="text-sm font-bold text-[#0e4d46]">{activeEvent.time} | {selectedDayFull} {fMonthName}</p></div>
                  <div><p className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest mb-2">EVENT TYPE</p>
                    <p className="text-sm font-bold text-[#0e4d46] uppercase tracking-wider">{activeEvent.event_type || 'Meeting'}</p>
                  </div>
                  <div><p className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest mb-2">LOCATION</p>
                    <p className="text-sm font-bold text-[#0e4d46]">{activeEvent.location || 'Not set'}</p>
                  </div>
                  <div><p className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest mb-2">MEETING LINK</p>
                    {meetingHref ? (
                      <a href={meetingHref} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-500 hover:underline break-all">{activeEvent.meetingLink}</a>
                    ) : (
                      <p className="text-sm font-bold text-[#5a827d]">Not set</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest mb-2">LINKED CRM RECORD</p>
                    <div className="space-y-2 text-sm font-bold text-[#0e4d46]">
                      <p>Deal: {activeEvent.linkedDealTitle || (activeEvent.deal ? dealLookup[String(activeEvent.deal)]?.label : null) || 'Not linked'}</p>
                      <p>Lead: {activeEvent.linkedLeadName || (activeEvent.deal ? dealLookup[String(activeEvent.deal)]?.leadName : null) || (activeEvent.lead ? `Lead #${activeEvent.lead}` : 'Not linked')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div><p className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest mb-2">DESCRIPTION</p><p className="text-sm font-medium text-[#5a827d] leading-relaxed">{activeEvent.description}</p></div>
                  <div>
                    <p className="text-[10px] font-extrabold text-[#5a827d] uppercase tracking-widest mb-4">ATTENDEES ({activeEvent.attendees.length})</p>
                    <div className="flex flex-wrap gap-3">
                      {activeEvent.attendees.map((attendee, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                          <div className="w-6 h-6 rounded-full bg-[#f0f7f6] flex items-center justify-center text-[10px] font-bold text-[#0e4d46]">{attendee.initials}</div>
                          <span className="text-xs font-bold text-[#0e4d46]">{attendee.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-sm font-bold text-[#5a827d]">No meetings scheduled for this day.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trashcan */}
      <motion.div 
        id="trash-bin"
        animate={{ 
          scale: draggingEventId ? (isOverTrash ? 1.3 : 1) : 0,
          opacity: draggingEventId ? 1 : 0,
          x: isOverTrash ? [-1, 1, -1, 1, 0] : 0,
          y: draggingEventId ? 0 : 100,
        }}
        transition={{
          x: { repeat: Infinity, duration: 0.2 },
          scale: { type: "spring", stiffness: 300, damping: 20 },
          opacity: { duration: 0.2 },
          y: { type: "spring", stiffness: 300, damping: 25 }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isOverTrash) setIsOverTrash(true);
        }}
        onDragLeave={() => setIsOverTrash(false)}
        onDrop={handleTrashDrop}
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex justify-center items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-[2.5px] border-dashed transition-colors duration-300 z-[100] group overflow-hidden ${isOverTrash ? 'border-red-500 bg-red-50' : 'border-red-300'}`}
      >
        <div className={`absolute inset-0 bg-red-100 transition-opacity ${isOverTrash ? 'opacity-40' : 'opacity-0'}`}></div>
        <svg className={`w-6 h-6 relative pointer-events-none transition-all duration-300 z-10 ${isOverTrash ? 'text-red-600 rotate-12 scale-110' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </motion.div>
    </div>
  );
};

export default Calendar;
