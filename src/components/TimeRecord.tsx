import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';
import { SleepRecord, FocusRecord, StudySession } from '../types';
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Moon, Sun, Edit3, Trash2, Save, X, Target, Play, Pause, Square, Book, History, ChevronDown } from 'lucide-react';

export default function TimeRecord() {
  const { 
    state, 
    addSleepRecord, updateSleepRecord, deleteSleepRecord, 
    updateFocusRecord, deleteFocusRecord, 
    setActiveSession, addStudySession, deleteStudySession, updateStudySession
  } = useAppContext();

  // ----- STUDY TIMER LOGIC -----
  const [now, setNow] = useState(Date.now());
  const [contentInput, setContentInput] = useState('');
  const [sessionCategory, setSessionCategory] = useState('科研');
  const [customCategory, setCustomCategory] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMinutes, setEditMinutes] = useState(0);

  const active = state.activeSession;

  useEffect(() => {
    let interval: any;
    if (active) {
      interval = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => clearInterval(interval);
  }, [active]);

  const elapsedMs = active ? now - active.startTime : 0;
  const elapsedRestMs = active ? active.totalRestMs + (active.status === 'rest' ? now - active.restStartTime! : 0) : 0;
  const netStudyMs = Math.max(0, elapsedMs - elapsedRestMs);
  const elapsedMins = Math.floor(netStudyMs / 60000);
  const elapsedSecs = Math.floor((netStudyMs % 60000) / 1000);

  const handleStart = () => {
    setActiveSession({
      startTime: Date.now(),
      status: 'study',
      restStartTime: null,
      totalRestMs: 0
    });
    setNow(Date.now());
  };

  const handleRestToggle = () => {
    if (!active) return;
    if (active.status === 'study') {
      setActiveSession({ ...active, status: 'rest', restStartTime: Date.now() });
    } else {
      const restDuration = Date.now() - active.restStartTime!;
      setActiveSession({
        ...active,
        status: 'study',
        restStartTime: null,
        totalRestMs: active.totalRestMs + restDuration
      });
    }
  };

  const initiateFinish = () => {
    if (elapsedMins < 1) {
      setShowShortAlert(true);
      return;
    }
    setIsFinishing(true);
  };

  const submitFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    addStudySession({
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: active.startTime,
      endTime: Date.now(),
      netStudyMinutes: elapsedMins,
      category: sessionCategory,
      content: contentInput || '未填写内容'
    });
    setActiveSession(null);
    setIsFinishing(false);
    setContentInput('');
    setCustomCategory('');
  };

  const startEdit = (s: StudySession) => {
    setEditingId(s.id);
    setEditContent(s.content);
    setEditMinutes(s.netStudyMinutes);
  };

  const saveEdit = () => {
    if (editingId) {
      updateStudySession(editingId, { content: editContent, netStudyMinutes: editMinutes });
      setEditingId(null);
    }
  };

  const [showShortAlert, setShowShortAlert] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.summary-card')) {
        setShowDetails(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const sessions = state.studySessions || [];
  const focusRecs = state.focusRecords || [];

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dSessions = sessions.filter(a => a.date === todayStr);
  const dFocus = focusRecs.filter(a => a.date === todayStr);

  const totalMinutesToday = dSessions.reduce((acc, curr) => acc + curr.netStudyMinutes, 0) + dFocus.reduce((acc, curr) => acc + curr.minutes, 0);

  const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEndStr = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const wSessions = sessions.filter(a => a.date >= weekStartStr && a.date <= weekEndStr);
  const wFocus = focusRecs.filter(a => a.date >= weekStartStr && a.date <= weekEndStr);

  const totalMinutesWeek = wSessions.reduce((acc, curr) => acc + curr.netStudyMinutes, 0) + wFocus.reduce((acc, curr) => acc + curr.minutes, 0);

  const getBreakdown = (sArr: any[], fArr: any[]) => {
    const sums: Record<string, number> = {};
    sArr.forEach(s => {
      const c = s.category || '科研';
      sums[c] = (sums[c] || 0) + s.netStudyMinutes;
    });
    fArr.forEach(f => {
      const c = f.type || '其他';
      sums[c] = (sums[c] || 0) + f.minutes;
    });
    return sums;
  };
  const todayBreakdown = Object.entries(getBreakdown(dSessions, dFocus)).sort((a,b)=>b[1]-a[1]);
  const weekBreakdown = Object.entries(getBreakdown(wSessions, wFocus)).sort((a,b)=>b[1]-a[1]);

  const [historyGroup, setHistoryGroup] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const getGroupKey = (dateStr: string) => {
    // Note: use simple string parsing or date-fns carefully with local time
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (historyGroup === 'year') return `${y}年`;
    if (historyGroup === 'month') return `${y}年${m}月`;
    if (historyGroup === 'week') {
      const sw = startOfWeek(dateObj, { weekStartsOn: 1 });
      const ew = endOfWeek(dateObj, { weekStartsOn: 1 });
      return `${format(sw, 'MM/dd')} - ${format(ew, 'MM/dd')} (第${format(dateObj, 'w')}周)`;
    }
    return dateStr;
  };

  const activeDates = Array.from(new Set([
    ...sessions.map(x => x.date),
    ...(state.sleepRecords||[]).map(x => x.date), 
    ...(state.focusRecords||[]).map(x => x.date)
  ])).sort((a,b) => b.localeCompare(a));

  const groupedHistory = activeDates.reduce((acc, dateStr) => {
    const key = getGroupKey(dateStr);
    if (!acc[key]) acc[key] = [];
    acc[key].push(dateStr);
    return acc;
  }, {} as Record<string, string[]>);

  const historyDisplayKeys = Object.keys(groupedHistory).sort((a,b) => b.localeCompare(a));

  // ----- SPLIT SLEEP RECORD LOGIC -----
  const [sleepDate, setSleepDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sleepStart, setSleepStart] = useState('23:30');
  const [wakeUp, setWakeUp] = useState('07:30');
  
  const [napDate, setNapDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [napMins, setNapMins] = useState<number | ''>('');

  const [editingSleep, setEditingSleep] = useState<string|null>(null);
  const [editSleepStart, setEditSleepStart] = useState('');
  const [editWakeUp, setEditWakeUp] = useState('');
  const [editNapMins, setEditNapMins] = useState(0);

  const [editingFocus, setEditingFocus] = useState<string|null>(null);
  const [editFocusMins, setEditFocusMins] = useState(0);

  const [showDetails, setShowDetails] = useState(false);

  const calculateSleepDuration = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let startMins = h1 * 60 + m1;
    let endMins = h2 * 60 + m2;
    if (startMins > endMins) endMins += 24 * 60; 
    return endMins - startMins;
  };

  const handleNightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSleepRecord({ date: sleepDate, sleepStart, wakeUp, type: 'night' as any });
    setOpenPanels(prev => ({...prev, sleep: false}));
  };

  const handleNapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSleepRecord({ date: napDate, napMinutes: Number(napMins) || 0, type: 'nap' as any });
    setNapMins('');
    setOpenPanels(prev => ({...prev, nap: false}));
  };

  const HistoryOverlay = () => (
    <div className="fixed inset-0 bg-base z-[60] flex flex-col items-center pt-8 md:pt-16 px-4 md:px-10 pb-20 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 shadow-2xl">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-line pb-4 gap-4">
          <div>
            <h3 className="text-[24px] font-bold font-serif text-text-main">历史足迹与归档</h3>
            <div className="flex gap-1 mt-2">
              {(['day', 'week', 'month', 'year'] as const).map(g => (
                <button 
                  key={g} 
                  onClick={() => setHistoryGroup(g)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full border transition-all ${historyGroup === g ? 'bg-sage text-white border-sage shadow-sm' : 'bg-card text-text-muted border-line hover:border-sage/40'}`}
                >
                  {g === 'day' ? '按日' : g === 'week' ? '按周' : g === 'month' ? '按月' : '按年'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowHistory(false)} className="p-2 bg-[#FAF8F6] border border-line text-text-main rounded-full hover:bg-line transition-colors self-end sm:self-center">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-12">
           {historyDisplayKeys.length === 0 ? (
             <p className="text-text-muted italic text-[14px]">暂无时光记录，快去添加您的第一天吧。</p>
           ) : (
             historyDisplayKeys.map(groupKey => (
               <div key={groupKey} className="space-y-6">
                  {historyGroup !== 'day' && (
                    <div className="flex items-center gap-3">
                      <div className="h-[2px] w-8 bg-sage" />
                      <span className="text-[18px] font-bold font-serif text-text-main">{groupKey}</span>
                      <div className="h-[1px] flex-1 bg-line" />
                    </div>
                  )}
                  {groupedHistory[groupKey].map(dateStr => {
                    const dSleep = (state.sleepRecords||[]).filter(x => x.date === dateStr);
                    const dFocus = (state.focusRecords||[]).filter(x => x.date === dateStr);
                    const dSessions = sessions.filter(x => x.date === dateStr);
                    const sessionCategorySums = dSessions.reduce((acc, curr) => {
                      const cat = curr.category || '未分类';
                      acc[cat] = (acc[cat] || 0) + curr.netStudyMinutes;
                      return acc;
                    }, {} as Record<string, number>);

                    return (
                      <div key={dateStr} className="bg-transparent border border-line rounded-card overflow-hidden shadow-sm">
                        <div className="bg-[#FAF8F6] border-b border-line px-5 py-3 font-bold font-serif text-text-main flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[16px]">
                          <span>{dateStr.replace(/-/g, ' / ')}</span>
                          {Object.keys(sessionCategorySums).length > 0 && (
                            <div className="flex flex-wrap gap-2 text-[12px] sm:ml-auto">
                              {Object.entries(sessionCategorySums).map(([cat, mins]) => (
                                <span key={cat} className="bg-card border border-line px-2 py-0.5 rounded-full text-text-muted text-[10px]">
                                  {cat}: <span className="font-bold text-sage">{mins}</span>m
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col gap-4 bg-base/30">
                          {dSessions.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-[12px] text-sage font-bold uppercase tracking-widest flex items-center gap-2"><Target size={14}/> 专注打卡</div>
                              {dSessions.sort((a,b) => b.startTime - a.startTime).map(session => (
                                <div key={session.id} className="relative group bg-card border border-line/60 rounded-[12px] p-4">
                                  {editingId === session.id ? (
                                    <div className="space-y-3">
                                      <input className="w-full bg-base border border-sage/50 rounded-[8px] p-2 text-[13px] outline-none" value={editContent} onChange={e => setEditContent(e.target.value)} />
                                      <div className="flex items-center gap-2">
                                        <input type="number" className="w-20 bg-base border border-sage/50 rounded-[8px] p-2 text-[13px] outline-none font-mono" value={editMinutes} onChange={e => setEditMinutes(Number(e.target.value))} />
                                        <span className="text-[12px] text-text-muted">分钟</span>
                                        <div className="ml-auto flex gap-2">
                                          <button onClick={saveEdit} className="p-1.5 bg-sage text-white rounded-[6px]"><Save size={14}/></button>
                                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-line text-text-main rounded-[6px]"><X size={14}/></button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="absolute top-3 right-3 flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1">
                                        <button onClick={() => startEdit(session)} className="p-1.5 text-text-muted hover:text-sage bg-base border border-line rounded-[8px] shadow-sm"><Edit3 size={12} /></button>
                                        <button onClick={() => deleteStudySession(session.id)} className="p-1.5 text-text-muted hover:text-terracotta bg-base border border-line rounded-[8px] shadow-sm"><Trash2 size={12} /></button>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <div className="font-mono text-[16px] font-bold text-sage">{session.netStudyMinutes} <span className="text-[12px] font-sans text-text-muted font-normal">m</span></div>
                                        <div className="text-[12px] text-text-muted font-mono bg-line/30 px-2 py-0.5 rounded border border-line/50">
                                          {format(session.startTime, 'HH:mm')} - {format(session.endTime, 'HH:mm')}
                                        </div>
                                      </div>
                                      <div className="text-[14px] text-text-main font-serif pr-12">
                                        {session.content && session.content !== '未填写内容' ? `“${session.content}”` : <span className="text-line italic">无备注</span>}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {dSleep.length > 0 && (
                            <div className="space-y-3 pt-2">
                              <div className="text-[12px] text-terracotta font-bold uppercase tracking-widest flex items-center gap-2"><Moon size={14}/> 睡眠与午休</div>
                              {dSleep.sort((a,b)=>b.timestamp - a.timestamp).map(sl => {
                                const isNight = sl.type === 'night' || (!!sl.sleepStart && !!sl.wakeUp);
                                const isNap = sl.type === 'nap' || (!!sl.napMinutes);
                                return (
                                  <div key={sl.id} className="relative group bg-white border border-line/60 rounded-[12px] p-4">
                                    {isNight && (
                                      <div className="flex flex-wrap items-center text-[14px]">
                                        <span className="font-mono font-bold text-text-main">{sl.sleepStart}</span>
                                        <span className="text-text-muted mx-2">-</span>
                                        <span className="font-mono font-bold text-text-main">{sl.wakeUp}</span>
                                        <span className="ml-4 text-[12px] bg-sage/10 text-sage px-2 py-0.5 rounded font-mono">
                                          {Math.floor(calculateSleepDuration(sl.sleepStart!, sl.wakeUp!)/60)}h {calculateSleepDuration(sl.sleepStart!, sl.wakeUp!)%60}m
                                        </span>
                                      </div>
                                    )}
                                    {isNap && (
                                      <div className={`text-[14px] text-text-muted ${isNight ? 'mt-2 pt-2 border-t border-line border-dashed' : ''} flex justify-between`}>
                                        <span>午休: <span className="font-mono font-bold text-terracotta">{sl.napMinutes}</span> 分钟</span>
                                      </div>
                                    )}
                                    <button onClick={() => deleteSleepRecord(sl.id)} className="absolute top-4 right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-terracotta"><Trash2 size={12}/></button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );

  const [openPanels, setOpenPanels] = useState({ focus: true, sleep: false, nap: false });

  useEffect(() => {
    if (active) setOpenPanels(prev => ({ ...prev, focus: true }));
  }, [active]);

  const toggleAccordion = (val: 'focus' | 'sleep' | 'nap') => {
    setOpenPanels(prev => {
      const next = { ...prev, [val]: !prev[val] };
      if (val === 'sleep' && next.sleep) next.nap = false;
      if (val === 'nap' && next.nap) next.sleep = false;
      return next;
    });
  };

  const todayNightSleepMs = (state.sleepRecords || []).find(x => x.date === todayStr && (x.type === 'night' || !!x.sleepStart));
  const todayNapMs = (state.sleepRecords || []).find(x => x.date === todayStr && (x.type === 'nap' || !!x.napMinutes));

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-start border-b border-line pb-4 md:pb-6">
        <div>
          <h2 className="text-[20px] md:text-[24px] font-bold font-serif text-text-main flex items-center gap-2">时光足迹</h2>
          <p className="text-[12px] md:text-[14px] text-text-muted mt-1 md:mt-2 tracking-wide">
            研究日志与作息安排，点滴时长汇聚伟大。
          </p>
        </div>
        <button onClick={() => setShowHistory(true)} className="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-[12px] bg-[#FAF8F6] border border-line text-sage hover:bg-sage hover:text-white transition-all shadow-sm">
           <Book size={16} /> <span className="hidden md:inline ml-2 text-[14px] font-bold text-nowrap">历史归档</span>
        </button>
      </div>

      {showHistory && <HistoryOverlay />}

      {showShortAlert && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-[280px] md:w-[320px] rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-line flex flex-col items-center">
            <h3 className="text-[16px] md:text-[18px] font-bold text-text-main mb-2">时长过短提示</h3>
            <p className="text-[13px] text-text-muted text-center mb-6">专注不足 1 分钟，记录将不被保存。</p>
            <div className="flex w-full gap-3">
              <button onClick={() => setShowShortAlert(false)} className="flex-1 bg-base border border-line text-text-main py-2.5 rounded-[12px] text-[13px] font-bold">继续</button>
              <button onClick={() => { setActiveSession(null); setShowShortAlert(false); }} className="flex-1 bg-terracotta text-white py-2.5 rounded-[12px] text-[13px] font-bold shadow-sm">放弃</button>
            </div>
          </div>
        </div>
      )}

      {/* Summaries */}
      <div className="grid grid-cols-2 gap-3 md:gap-[30px]">
         {/* Today Card */}
         <motion.div 
           layout
           onClick={() => setShowDetails(!showDetails)} 
           className="summary-card group relative bg-card rounded-card p-5 md:p-6 transition-all duration-300 cursor-pointer border border-line shadow-theme overflow-hidden flex flex-col"
         >
          <motion.div layout className="absolute top-0 right-0 w-32 h-32 bg-terracotta/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
          <motion.div layout className="flex justify-between items-center z-10 relative w-full mb-auto">
             <div className="flex flex-col gap-1.5">
               <div className="flex flex-col opacity-60">
                 <div className="flex items-center gap-1.5 h-[16px] md:h-[20px]">
                   <Target size={12} className="text-terracotta" />
                   <span className="text-[11px] md:text-[12px] font-bold tracking-[0.2em] text-text-muted uppercase">Today</span>
                 </div>
                 <div className="text-[11px] md:text-[12px] font-mono mt-0.5 leading-none transition-all">{format(new Date(), 'yyyy / MM / dd')}</div>
               </div>
               <div className="text-[18px] md:text-[20px] font-bold font-serif text-text-main whitespace-nowrap">今日打卡</div>
             </div>
              <div className="flex flex-col items-end justify-center text-terracotta font-mono tracking-tighter leading-none ml-auto">
                <div className="flex items-baseline">
                  <span className="text-[20px] md:text-[28px] font-black">{Math.floor(totalMinutesToday / 60)}</span>
                  <span className="text-[14px] md:text-[16px] ml-0.5 opacity-40 font-sans">h</span>
                </div>
                <div className="flex items-baseline mt-1">
                  <span className="text-[20px] md:text-[28px] font-black">{totalMinutesToday % 60}</span>
                  <span className="text-[14px] md:text-[16px] ml-0.5 opacity-40 font-sans">m</span>
                </div>
              </div>
          </motion.div>
          <AnimatePresence>
            {showDetails && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-10 mt-4 pt-4 border-t border-line/40 overflow-hidden"
              >
                {todayBreakdown.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {todayBreakdown.map(([cat, mins]) => (
                      <div key={cat} className="flex justify-between text-[11px] md:text-[12px]">
                        <span className="text-text-muted">{cat}</span>
                        <span className="font-bold font-mono">{mins}m</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-[11px] text-text-muted italic text-center">暂无记录</div>}
              </motion.div>
            )}
          </AnimatePresence>
         </motion.div>

         {/* Week Card */}
         <motion.div 
           layout
           onClick={() => setShowDetails(!showDetails)} 
           className="summary-card group relative bg-card rounded-card p-5 md:p-6 transition-all duration-300 cursor-pointer border border-line shadow-theme overflow-hidden flex flex-col"
         >
          <motion.div layout className="absolute top-0 right-0 w-32 h-32 bg-sage/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
          <motion.div layout className="flex justify-between items-center z-10 relative w-full mb-auto">
             <div className="flex flex-col gap-1.5">
               <div className="flex flex-col opacity-60">
                 <div className="flex items-center gap-1.5 h-[16px] md:h-[20px]">
                   <Target size={12} className="text-sage" />
                   <span className="text-[11px] md:text-[12px] font-bold tracking-[0.2em] text-text-muted uppercase">Week Total</span>
                 </div>
                 {/* Empty date placeholder with same height as today's date */}
                 <div className="text-[11px] md:text-[12px] font-mono mt-0.5 leading-none transition-all opacity-0 select-none">YYYY / MM / DD</div>
               </div>
               <div className="text-[18px] md:text-[20px] font-bold font-serif text-text-main whitespace-nowrap">本周累计</div>
             </div>
             <div className="flex flex-col items-end justify-center text-sage font-mono tracking-tighter leading-none ml-auto">
                <div className="flex items-baseline">
                  <span className="text-[20px] md:text-[28px] font-black">{Math.floor(totalMinutesWeek / 60)}</span>
                  <span className="text-[14px] md:text-[16px] ml-0.5 opacity-40 font-sans">h</span>
                </div>
                <div className="flex items-baseline mt-1">
                  <span className="text-[20px] md:text-[28px] font-black">{totalMinutesWeek % 60}</span>
                  <span className="text-[14px] md:text-[16px] ml-0.5 opacity-40 font-sans">m</span>
                </div>
             </div>
          </motion.div>
          <AnimatePresence>
            {showDetails && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-10 mt-4 pt-4 border-t border-line/40 overflow-hidden"
              >
                {weekBreakdown.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {weekBreakdown.map(([cat, mins]) => (
                      <div key={cat} className="flex justify-between text-[11px] md:text-[12px]">
                        <span className="text-text-muted">{cat}</span>
                        <span className="font-bold font-mono">{mins}m</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-[11px] text-text-muted italic text-center">暂无记录</div>}
              </motion.div>
            )}
          </AnimatePresence>
         </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-[30px]">
        {/* Timer */}
        <div className="col-span-1 xl:col-span-2 bg-card p-5 md:p-6 rounded-card border shadow-theme">
           <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleAccordion('focus')}>
             <div className="flex items-center gap-2 text-[16px] font-bold font-serif text-text-main">
               <Target size={18} className="text-sage" /> 专注计时器
             </div>
             <div className="flex items-center gap-3">
               {active && <span className="text-[12px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded animate-pulse">正在专注</span>}
               <button className="text-text-muted transition-transform duration-300" style={{ transform: openPanels.focus ? 'rotate(180deg)' : 'none' }}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
               </button>
             </div>
           </div>
          {openPanels.focus && (
            <div className="mt-4 pt-4 border-t border-line animate-in slide-in-from-top-2">
              {!active ? (
                <div className="py-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-4 border-base flex items-center justify-center mb-6 text-line">00:00</div>
                  <button onClick={handleStart} className="bg-sage text-white px-10 py-3 rounded-full font-bold shadow-md hover:bg-sage-dark transition-all">开始专注</button>
                </div>
              ) : isFinishing ? (
                <form onSubmit={submitFinish} className="space-y-4">
                  <h3 className="text-center font-bold text-sage">{elapsedMins} 分钟已完成</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <select value={sessionCategory} onChange={e=>setSessionCategory(e.target.value)} className="p-3 border rounded-[12px] bg-base">
                       <option value="科研">科研</option><option value="休闲">休闲</option><option value="其他">其他</option>
                    </select>
                    <input type="text" value={contentInput} onChange={e=>setContentInput(e.target.value)} placeholder="专注内容..." className="p-3 border rounded-[12px] bg-base" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsFinishing(false)} className="flex-1 border p-3 rounded-[12px]">返回</button>
                    <button type="submit" className="flex-1 bg-sage text-white p-3 rounded-[12px] font-bold">归档记录</button>
                  </div>
                </form>
              ) : (
                <div className="py-6 flex flex-col items-center">
                   <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-6 ${active.status === 'study' ? 'border-sage shadow-inner bg-sage/5' : 'border-line'}`}>
                     <span className="text-2xl font-mono font-bold">{String(elapsedMins).padStart(2,'0')}:{String(elapsedSecs).padStart(2,'0')}</span>
                   </div>
                   <div className="flex gap-4 w-full px-4">
                      <button onClick={handleRestToggle} className="flex-1 bg-base border p-3 rounded-full font-bold">{active.status === 'study' ? '开始休息' : '结束休息'}</button>
                      <button onClick={initiateFinish} className="flex-1 bg-terracotta text-white p-3 rounded-full font-bold shadow-sm">结束专注</button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sleep Record Forms */}
        <div className="col-span-1 flex flex-col gap-4">
           {/* Night Sleep */}
           <div className="bg-card rounded-card shadow-theme border border-line p-5">
             <div onClick={() => toggleAccordion('sleep')} className="flex justify-between items-center cursor-pointer">
               <div className="flex items-center gap-2 text-[16px] font-bold font-serif text-text-main">
                 <Moon size={18} className="text-sage"/> 夜间睡眠
               </div>
               <div className="flex items-center gap-3">
                 {todayNightSleepMs && (
                   <span className="text-[11px] font-bold text-text-muted bg-base px-2 py-0.5 rounded animate-in fade-in">
                      {Math.floor(calculateSleepDuration(todayNightSleepMs.sleepStart!, todayNightSleepMs.wakeUp!)/60)}h {calculateSleepDuration(todayNightSleepMs.sleepStart!, todayNightSleepMs.wakeUp!)%60}m
                   </span>
                 )}
                 <button className="text-text-muted transition-transform duration-300" style={{ transform: openPanels.sleep ? 'rotate(180deg)' : 'none' }}>
                   <ChevronDown size={18} />
                 </button>
               </div>
             </div>
             {openPanels.sleep && (
               <form onSubmit={handleNightSubmit} className="mt-4 pt-4 border-t border-line space-y-4 animate-in slide-in-from-top-2">
                 <div className="grid grid-cols-2 gap-3">
                   <div><label className="text-[11px] text-text-muted block mb-1">睡下时间</label><input type="time" value={sleepStart} onChange={e=>setSleepStart(e.target.value)} required className="w-full p-2 border rounded font-mono text-[13px]"/></div>
                   <div><label className="text-[11px] text-text-muted block mb-1">起床时间</label><input type="time" value={wakeUp} onChange={e=>setWakeUp(e.target.value)} required className="w-full p-2 border rounded font-mono text-[13px]"/></div>
                 </div>
                 <button type="submit" className="w-full bg-sage text-white py-2.5 rounded-[12px] font-bold text-[13px] shadow-sm">记录睡眠</button>
               </form>
             )}
           </div>

           {/* Nap */}
           <div className="bg-card rounded-card shadow-theme border border-line p-5">
             <div onClick={() => toggleAccordion('nap')} className="flex justify-between items-center cursor-pointer">
               <div className="flex items-center gap-2 text-[16px] font-bold font-serif text-text-main">
                 <Sun size={18} className="text-terracotta"/> 午休
               </div>
               <div className="flex items-center gap-3">
                 {todayNapMs && <span className="text-[11px] font-bold text-text-muted bg-base px-2 py-0.5 rounded animate-in fade-in">{todayNapMs.napMinutes}m</span>}
                 <button className="text-text-muted transition-transform duration-300" style={{ transform: openPanels.nap ? 'rotate(180deg)' : 'none' }}>
                   <ChevronDown size={18} />
                 </button>
               </div>
             </div>
             {openPanels.nap && (
               <form onSubmit={handleNapSubmit} className="mt-4 pt-4 border-t border-line space-y-4 animate-in slide-in-from-top-2">
                 <div><label className="text-[11px] text-text-muted block mb-1">午休时长 (分钟)</label><input type="number" value={napMins} onChange={e=>setNapMins(e.target.value === '' ? '' : Number(e.target.value))} required className="w-full p-2 border rounded font-mono text-[13px] outline-none" min="1"/></div>
                 <button type="submit" className="w-full bg-terracotta text-white py-2.5 rounded-[12px] font-bold text-[13px] shadow-sm">记录午休</button>
               </form>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
