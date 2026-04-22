import React, { useState } from 'react';
import { useAppContext } from '../store';
import { FitnessCategory, CardioType, StrengthBodyPart, FitnessRecord } from '../types';
import { Activity, Scale, Timer, Mountain, Trash2, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const CARDIO_TYPES: CardioType[] = ['跑步机 (跑步)', '跑步机 (爬坡)', '爬楼机', '跑步', '跳绳', '其他'];
const BODY_PARTS: StrengthBodyPart[] = ['胸部', '背部', '腿部', '肩部', '手臂', '核心'];

export default function FitnessRecordComponent() {
  const { state, addFitnessRecord, deleteFitnessRecord } = useAppContext();
  
  const [tab, setTab] = useState<FitnessCategory>('Cardio');
  const [loggedDate, setLoggedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Cardio States
  const [cardioType, setCardioType] = useState<CardioType>('跑步机 (跑步)');
  const [duration, setDuration] = useState(30);
  const [incline, setIncline] = useState(0);
  const [otherNote, setOtherNote] = useState('');

  // Strength States
  const [strengthPart, setStrengthPart] = useState<StrengthBodyPart>('胸部');
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState(0);
  const [unit, setUnit] = useState<'kg'|'lbs'>('kg');
  const [sets, setSets] = useState(4);
  const [reps, setReps] = useState(10);

  const [showHistory, setShowHistory] = useState(false);
  const [historyGroup, setHistoryGroup] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [stagedRecords, setStagedRecords] = useState<Omit<FitnessRecord, 'id' | 'timestamp'>[]>([]);

  const convertedDisplay = () => {
    if (weight <= 0) return null;
    if (unit === 'kg') return `${(weight * 2.20462).toFixed(1)} lbs`;
    return `${(weight / 2.20462).toFixed(1)} kg`;
  };

  const handleCardioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStagedRecords(prev => [...prev, { loggedDate, category: 'Cardio', cardioType, durationMinutes: duration, incline, otherNote }]);
    setDuration(30); setIncline(0); setOtherNote('');
  };

  const handleStrengthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;
    setStagedRecords(prev => [...prev, { loggedDate, category: 'Strength', strengthPart, exerciseName, weight, weightUnit: unit, sets, reps }]);
    setExerciseName(''); setWeight(0);
  };

  const handleArchive = async () => {
    if (stagedRecords.length === 0) return;
    for (const record of stagedRecords) {
      await addFitnessRecord(record);
    }
    setStagedRecords([]);
  };

  const removeFromStage = (index: number) => {
    setStagedRecords(prev => prev.filter((_, i) => i !== index));
  };

  const getGroupKey = (dateStr: string) => {
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

  const sortedRecords = [...(state.fitnessRecords || [])].sort((a,b) => {
    if (a.loggedDate !== b.loggedDate) {
      return b.loggedDate.localeCompare(a.loggedDate); 
    }
    return b.timestamp - a.timestamp;
  });

  const availableDates = Array.from(new Set(sortedRecords.map(x => x.loggedDate))).sort((a,b) => b.localeCompare(a));
  
  const groupedHistory = availableDates.reduce((acc, dateStr) => {
    const key = getGroupKey(dateStr);
    if (!acc[key]) acc[key] = [];
    acc[key].push(dateStr);
    return acc;
  }, {} as Record<string, string[]>);

  const historyDisplayKeys = Object.keys(groupedHistory).sort((a,b) => b.localeCompare(a));

  const groupedByDate = sortedRecords.reduce((acc, record) => {
    if (!acc[record.loggedDate]) acc[record.loggedDate] = [];
    acc[record.loggedDate].push(record);
    return acc;
  }, {} as Record<string, FitnessRecord[]>);

  const HistoryOverlay = () => (
    <div className="fixed inset-0 bg-base z-[60] flex flex-col items-center pt-8 md:pt-16 px-4 md:px-10 pb-20 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 shadow-2xl">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-line pb-4 gap-4">
          <div>
            <h3 className="text-[24px] font-bold font-serif text-text-main">往日运动归档</h3>
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
            <p className="text-text-muted italic text-[14px]">暂无历史运动记录。</p>
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
                {groupedHistory[groupKey].map(dateKey => (
                   <div key={dateKey} className="bg-transparent">
                      <div className="font-serif font-bold text-sage text-[16px] mb-3 ml-2 flex items-center gap-2">
                         {format(new Date(dateKey.replace(/-/g, '/')), 'yyyy年MM月dd日')}
                      </div>
                      <div className="space-y-3">
                        {groupedByDate[dateKey].map(record => (
                          <div key={record.id} className="relative bg-[#FAF8F6] border border-line p-5 rounded-card flex justify-between items-center group shadow-sm transition-all hover:bg-white text-left">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-card" style={{ backgroundColor: record.category === 'Cardio' ? '#7B8A74' : '#B97A67' }} />
                            
                            <div className="pl-3">
                              <div className="text-[16px] font-bold text-text-main mb-1">
                                {record.category === 'Cardio' 
                                  ? (record.cardioType === '其他' && record.otherNote ? `其他 (${record.otherNote})` : record.cardioType) 
                                  : record.exerciseName}
                              </div>
                              <div className="text-[14px] font-serif italic text-text-muted leading-relaxed">
                                {record.category === 'Cardio' ? (
                                  `锻炼时长 ${record.durationMinutes} 分钟 • 坡度/阻力: ${record.incline}`
                                ) : (
                                  `【${record.strengthPart}】 ${record.weight}${record.weightUnit} × ${record.sets}组 × ${record.reps}次`
                                )}
                              </div>
                            </div>

                            <button onClick={() => deleteFitnessRecord(record.id)} className="p-2 text-text-muted hover:text-terracotta opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <Trash2 size={18}/>
                            </button>
                          </div>
                        ))}
                      </div>
                   </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-start border-b border-line pb-4 md:pb-6 text-left">
        <div>
          <h2 className="text-[20px] md:text-[24px] font-bold font-serif text-text-main flex items-center gap-2">
            <Mountain size={20} className="text-sage"/> 运动记录
          </h2>
          <p className="text-[12px] md:text-[14px] text-text-muted mt-1 md:mt-2 tracking-wide">记录您在有氧与无氧器械上的挥汗历程与突破。</p>
        </div>
        <button onClick={() => setShowHistory(true)} className="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-[12px] bg-[#FAF8F6] border border-line text-sage hover:bg-sage hover:text-white transition-all shadow-sm">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> <span className="hidden md:inline ml-2 text-[14px] font-bold text-nowrap">运动历史</span>
        </button>
      </div>

      {showHistory && <HistoryOverlay />}

      <div className="bg-card p-6 rounded-card shadow-theme border border-line mb-4 text-left">
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 border-b border-line pb-4">
          <label className="text-[14px] font-bold text-text-main">本次训练日期:</label>
          <input 
             type="date" value={loggedDate} onChange={(e) => setLoggedDate(e.target.value)} required
             className="w-48 font-mono rounded-[12px] bg-[#FAF8F6] border border-line py-2 px-3 outline-none text-[14px] text-sage" 
          />
        </div>

        <div className="flex border-b border-line">
          <button onClick={() => setTab('Cardio')} className={`flex-1 py-4 text-[15px] font-bold tracking-wider transition-colors ${tab === 'Cardio' ? 'bg-sage/10 text-sage' : 'bg-transparent text-text-muted hover:bg-[#FAF8F6]'}`}>
            有氧
          </button>
          <button onClick={() => setTab('Strength')} className={`flex-1 py-4 text-[15px] font-bold tracking-wider transition-colors ${tab === 'Strength' ? 'bg-terracotta/10 text-terracotta' : 'bg-transparent text-text-muted hover:bg-[#FAF8F6]'}`}>
            无氧
          </button>
        </div>

        <div className="pt-6">
          {tab === 'Cardio' ? (
            <form onSubmit={handleCardioSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[12px] text-text-muted uppercase mb-1 flex items-center gap-1"><Activity size={12}/> 选择运动</label>
                <select value={cardioType} onChange={e => setCardioType(e.target.value as any)} className="w-full rounded-[12px] bg-[#FAF8F6] border border-line p-3 outline-none text-[15px]">
                  {CARDIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {cardioType === '其他' && (
                  <input type="text" placeholder="请具体说明..." value={otherNote} onChange={e => setOtherNote(e.target.value)}
                    className="w-full mt-2 rounded-[12px] bg-[#FAF8F6] border border-line p-2 outline-none text-[13px] text-text-main" />
                )}
              </div>
              <div>
                <label className="block text-[12px] text-text-muted uppercase mb-1 flex items-center gap-1"><Timer size={12}/> 锻炼时长 (分钟)</label>
                <input type="number" min="1" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full font-mono rounded-[12px] bg-[#FAF8F6] border border-line p-3 outline-none text-[15px]" />
              </div>
              <div>
                <label className="block text-[12px] text-text-muted uppercase mb-1 flex items-center gap-1"><Mountain size={12}/> 训练坡度 / 阻力</label>
                <input type="number" min="0" value={incline} onChange={e => setIncline(Number(e.target.value))} className="w-full font-mono rounded-[12px] bg-[#FAF8F6] border border-line p-3 outline-none text-[15px]" />
              </div>
              <div className="col-span-1 md:col-span-3 flex justify-end mt-2">
                 <button type="submit" className="bg-sage hover:bg-sage-dark text-white px-8 py-3 rounded-[12px] opacity-90 transition-all font-medium">添加有氧记录</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStrengthSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-[12px] text-text-muted uppercase mb-1">目标部位</label>
                <select value={strengthPart} onChange={e => setStrengthPart(e.target.value as any)} className="w-full rounded-[12px] bg-[#FAF8F6] border border-line p-3 outline-none text-[15px]">
                  {BODY_PARTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-1 md:col-span-3">
                <label className="block text-[12px] text-text-muted uppercase mb-1">器械 / 动作名称</label>
                <input type="text" value={exerciseName} onChange={e => setExerciseName(e.target.value)} required placeholder="例如：卧推、深蹲..." className="w-full rounded-[12px] bg-[#FAF8F6] border border-line p-3 outline-none text-[15px]" />
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[12px] text-text-muted uppercase mb-1 flex items-center gap-1"><Scale size={12}/> 负重值</label>
                <div className="flex border border-line rounded-[12px] bg-[#FAF8F6] overflow-hidden focus-within:border-terracotta">
                  <input type="number" min="0" step="0.5" value={weight} onChange={e => setWeight(Number(e.target.value))} className="flex-1 bg-transparent p-3 outline-none font-mono text-[15px]" />
                  <select value={unit} onChange={e => setUnit(e.target.value as any)} className="bg-transparent border-l border-line p-3 outline-none text-[14px] font-bold text-terracotta w-20 text-center">
                    <option value="kg">KG</option>
                    <option value="lbs">LBS</option>
                  </select>
                </div>
                {weight > 0 && <p className="text-[12px] text-text-muted mt-1 text-right font-mono tracking-tighter">≈ {convertedDisplay()}</p>}
              </div>

              <div>
                <label className="block text-[12px] text-text-muted uppercase mb-1">组数 (Sets)</label>
                <input type="number" min="1" value={sets} onChange={e => setSets(Number(e.target.value))} className="w-full font-mono rounded-[12px] bg-[#FAF8F6] border border-line p-3 outline-none text-[15px]" />
              </div>
              <div>
                <label className="block text-[12px] text-text-muted uppercase mb-1">每组次数 (Reps)</label>
                <input type="number" min="1" value={reps} onChange={e => setReps(Number(e.target.value))} className="w-full font-mono rounded-[12px] bg-[#FAF8F6] border border-line p-3 outline-none text-[15px]" />
              </div>

              <div className="col-span-1 md:col-span-4 flex justify-end mt-2">
                 <button type="submit" className="bg-terracotta hover:bg-[#a36957] text-white px-8 py-3 rounded-[12px] opacity-90 transition-all font-medium flex items-center justify-center w-full md:w-auto">添加无氧记录</button>
              </div>
            </form>
          )}
        </div>

        {stagedRecords.length > 0 && (
          <div className="mt-8 pt-6 border-t border-line/40 animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-[14px] font-bold font-serif text-text-main mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sage animate-pulse" /> 本次暂存记录
            </h3>
            <div className="space-y-3 mb-6">
              {stagedRecords.map((record, index) => (
                <div key={index} className="relative bg-[#FAF8F6] border border-line p-4 rounded-card flex justify-between items-center group shadow-sm transition-all hover:bg-white text-[14px]">
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-card" style={{ backgroundColor: record.category === 'Cardio' ? '#7B8A74' : '#B97A67' }} />
                  <div className="pl-2">
                    <span className="font-bold text-text-main">
                      {record.category === 'Cardio' 
                        ? (record.cardioType === '其他' && record.otherNote ? `其他 (${record.otherNote})` : record.cardioType) 
                        : record.exerciseName}
                    </span>
                    <span className="text-text-muted ml-3 font-mono text-[13px]">
                      {record.category === 'Cardio' ? (
                        `${record.durationMinutes} 分钟 • 坡度/阻力: ${record.incline}`
                      ) : (
                        `【${record.strengthPart}】 ${record.weight}${record.weightUnit} × ${record.sets}组 × ${record.reps}次`
                      )}
                    </span>
                  </div>
                  <button onClick={() => removeFromStage(index)} className="p-1 text-text-muted hover:text-terracotta transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleArchive} className="w-full bg-text-main text-white py-3.5 rounded-[16px] font-bold shadow-theme hover:bg-[#222] transition-colors flex items-center justify-center gap-2">
              🏆 结束本次训练并归档
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
