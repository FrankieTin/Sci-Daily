import React, { useState } from 'react';
import { useAppContext } from '../store';
import { JournalEntry } from '../types';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { BookOpen, Smile, Meh, Frown, Sparkles, Coffee, Book, X } from 'lucide-react';

const MOODS = [
  { value: '灵感涌现', icon: Sparkles, color: 'text-terracotta', bg: 'hover:bg-terracotta/10' },
  { value: '效率很高', icon: Coffee, color: 'text-sage', bg: 'hover:bg-sage/10' },
  { value: '平淡', icon: Smile, color: 'text-text-muted', bg: 'hover:bg-[#FAF8F6]' },
  { value: '压力大', icon: Meh, color: 'text-[#D49B8B]', bg: 'hover:bg-[#FDF4F0]' },
  { value: '精疲力尽', icon: Frown, color: 'text-[#64735c]', bg: 'hover:bg-sage/5' },
] as const;

export default function Journal() {
  const { state, addJournal } = useAppContext();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('平淡');
  const [showHistory, setShowHistory] = useState(false);
  const [historyGroup, setHistoryGroup] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addJournal({ content, mood });
    setContent(''); setMood('平淡');
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

  const sortedJournals = [...(state.journals || [])].sort((a, b) => b.timestamp - a.timestamp);
  const availableDates = Array.from(new Set(sortedJournals.map(x => x.date))).sort((a,b) => b.localeCompare(a));

  const groupedHistory = availableDates.reduce((acc, dateStr) => {
    const key = getGroupKey(dateStr);
    if (!acc[key]) acc[key] = [];
    acc[key].push(dateStr);
    return acc;
  }, {} as Record<string, string[]>);

  const historyDisplayKeys = Object.keys(groupedHistory).sort((a,b) => b.localeCompare(a));

  const HistoryOverlay = () => (
    <div className="fixed inset-0 bg-base z-[60] flex flex-col items-center pt-8 md:pt-16 px-4 md:px-10 pb-20 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 shadow-2xl">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-line pb-4 gap-4">
          <div>
            <h3 className="text-[24px] font-bold font-serif text-text-main">历史随记归档</h3>
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
            <p className="text-text-muted italic text-[15px]">您还未留下一抹笔墨，在上面开启您的第一篇科研手记吧！</p>
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
                    const dayJournals = sortedJournals.filter(j => j.date === dateStr);
                    return (
                      <div key={dateStr} className="space-y-6">
                        {dayJournals.map((entry) => {
                          const MoodConfig = MOODS.find(m => m.value === entry.mood) || MOODS[2];
                          const MoodIcon = MoodConfig.icon;
                          
                          return (
                            <div key={entry.id} className="relative pl-10 before:absolute before:left-[19px] before:top-2 before:bottom-[-32px] before:w-[2px] before:bg-line last:before:hidden mb-6 text-left">
                              <div className="absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center bg-card border border-line shadow-sm z-10">
                                <MoodIcon size={18} className={MoodConfig.color} />
                              </div>
                              <div className="bg-card p-7 rounded-card shadow-theme border border-line">
                                <div className="flex justify-between items-center mb-4">
                                  <span className="font-bold text-[18px] font-serif text-text-main">{format(new Date(entry.date.replace(/-/g, '/')), 'yyyy年MM月dd日 - EEEE')}</span>
                                  <span className="text-[12px] font-mono text-text-muted uppercase tracking-wider">
                                    {format(entry.timestamp, 'HH:mm')}
                                  </span>
                                </div>
                                <p className="text-text-main text-[16px] whitespace-pre-wrap leading-[2] font-serif overflow-hidden">
                                  {entry.content}
                                </p>
                              </div>
                            </div>
                          )
                        })}
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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-start border-b border-line pb-4 md:pb-6">
        <div>
          <h2 className="text-[20px] md:text-[24px] font-bold font-serif text-text-main flex items-center gap-2">
            日常随想
          </h2>
          <p className="text-[12px] md:text-[14px] text-text-muted mt-1 md:mt-2 tracking-wide">在字里行间卸下防备，记录求索路上的困惑、灵感亦或是碎片心情。</p>
        </div>
        <button onClick={() => setShowHistory(true)} className="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-[12px] bg-[#FAF8F6] border border-line text-sage hover:bg-sage hover:text-white transition-all shadow-sm">
           <Book size={16} /> <span className="hidden md:inline ml-2 text-[14px] font-bold text-nowrap">随想历史</span>
        </button>
      </div>

      {showHistory && <HistoryOverlay />}

      <div className="bg-card p-8 rounded-card shadow-theme border border-line mb-8 max-w-3xl text-left">
        <h3 className="text-[18px] font-bold font-serif text-text-main mb-6">今日感悟</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-3">今日状态</label>
            <div className="flex flex-wrap gap-3">
              {MOODS.map(m => {
                const Icon = m.icon;
                const isSelected = mood === m.value;
                return (
                  <button
                    type="button" key={m.value} onClick={() => setMood(m.value as any)}
                    className={`flex flex-col items-center justify-center py-4 px-2 rounded-[16px] border transition-all duration-200 flex-1 min-w-[70px]
                      ${isSelected ? 'border-sage bg-sage/5' : `border-transparent bg-[#FAF8F6] ${m.bg}`}`}
                  >
                    <Icon size={22} className={isSelected ? m.color : 'text-text-muted'} />
                    <span className={`text-[11px] mt-2 font-bold tracking-wider ${isSelected ? 'text-sage' : 'text-text-muted'}`}>
                      {m.value}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-3">随笔杂记</label>
            <textarea 
              className="w-full rounded-[16px] bg-[#FAF8F6] border border-line p-5 outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all text-text-main min-h-[160px] text-[15px] font-serif italic leading-[1.8] resize-y"
              placeholder="“今天在实验室重新审视了去年的失败数据，发现噪声分布似乎并非完全随机...”"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" disabled={!content.trim()}
              className="bg-sage hover:bg-sage-dark disabled:opacity-50 disabled:hover:bg-sage text-white px-8 py-3.5 rounded-[16px] text-[15px] transition-all flex items-center gap-2 shadow-sm"
            >
              <BookOpen size={18} /> 保存日记
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
