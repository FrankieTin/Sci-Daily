import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { Paper, PaperStatus } from '../types';
import { Folder, Plus, Trash2, CheckCircle2, FileText, Send, Edit3, X, History, FileUp, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const WRITING_STATUSES: PaperStatus[] = ['规划中', '撰写中', '准备投稿'];
const SUBMISSION_STATUSES: PaperStatus[] = ['已投出', '审稿中', '大修', '小修', '已录用', '被拒稿'];

export default function PaperProgress() {
  const { state, addPaper, updatePaper, deletePaper, addAchievement } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'writing'|'submissions'|'review'|'published'>('writing');
  
  // Adding Paper States
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetVenue, setTargetVenue] = useState('');
  const [status, setStatus] = useState<PaperStatus>('规划中');
  const [progress, setProgress] = useState(0);

  // Expanded card tracking
  const [expandedWritingId, setExpandedWritingId] = useState<string|null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string|null>(null);
  const [expandedRevId, setExpandedRevId] = useState<string|null>(null);
  const [expandedPublishedId, setExpandedPublishedId] = useState<string|null>(null);

  // Dropdown States
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string|null>(null);

  // New Submission States
  const [addingSubId, setAddingSubId] = useState<string|null>(null);
  const [subVenue, setSubVenue] = useState('');
  const [subDate, setSubDate] = useState('');

  // Published Tab Editing
  const [editingPublishedId, setEditingPublishedId] = useState<string|null>(null);
  const [pubEditState, setPubEditState] = useState<{
    title: string;
    venue: string;
    publishDate: string;
    publishStatusNote: string;
    customFields: Record<string, string>;
    newFieldKey: string;
    newFieldValue: string;
  }>({ title: '', venue: '', publishDate: '', publishStatusNote: '', customFields: {}, newFieldKey: '', newFieldValue: '' });

  // Accepted Modal State
  const [acceptedPaperInfo, setAcceptedPaperInfo] = useState<{id: string, title: string, venue: string} | null>(null);
  const [reflection, setReflection] = useState('');
  const [customStatusInput, setCustomStatusInput] = useState<{paperId: string, subId: string, value: string} | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.paper-card')) {
        setExpandedWritingId(null);
        setExpandedSubId(null);
        setExpandedRevId(null);
        setExpandedPublishedId(null);
        setStatusMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const papers = state.papers || [];

  const deleteSubmission = (paperId: string, subId: string) => {
    const paper = papers.find(p => p.id === paperId);
    if (!paper) return;
    const newSubs = (paper.submissions || []).filter(s => s.id !== subId);
    updatePaper(paperId, { submissions: newSubs });
  };

  const startReview = (paperId: string, subId: string) => {
  const paper = papers.find(p => p.id === paperId);
  if (!paper) return;
  const today = format(new Date(), 'yyyy-MM-dd');
  const newSubs = paper.submissions.map(s => {
    if (s.id === subId) {
      const events = s.events || [];
      if (!events.some(e => e.status === '投递')) {
         events.unshift({ id: uuidv4(), date: s.submitDate || today, status: '投递' });
      }
      return {
        ...s, 
        status: '审稿中' as PaperStatus, 
        underReviewDate: s.underReviewDate || today,
        events: [...events, { id: uuidv4(), date: today, status: '外审' }]
      };
    }
    return s;
  });
  
  let overall = paper.status;
  if (['规划中', '撰写中', '准备投稿', '已投出'].includes(overall)) {
     overall = '审稿中';
  }
  updatePaper(paperId, { status: overall, submissions: newSubs });
  setActiveTab('review');
  setExpandedRevId(paperId);
};

  const markAsRejected = (paperId: string, subId: string) => {
  const paper = papers.find(p => p.id === paperId);
  if (!paper) return;
  const today = format(new Date(), 'yyyy-MM-dd');
  const newSubs = paper.submissions.map(s => {
    if (s.id === subId) {
       return {
         ...s, 
         status: '拒稿' as PaperStatus,
         events: [...(s.events || []), { id: uuidv4(), date: today, status: '拒稿' }]
       };
    }
    return s;
  });
  const hasReview = newSubs.some(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any));
  const hasAccepted = newSubs.some(s => s.status === '录用' || s.status === '已录用');
  let overall = paper.status;
  if (hasAccepted) overall = '已录用';
  else if (hasReview) overall = '审稿中';
  else overall = '已投出';
  updatePaper(paperId, { status: overall, submissions: newSubs });
};

  const handleCreate = () => {
    setIsAdding(true);
    setStatus(activeTab === 'writing' ? '规划中' : '审稿中');
    setTargetVenue(''); setTitle(''); setDescription(''); setProgress(0);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addPaper({ title, description, targetVenue, status, progress, deadlineString: null });
    setIsAdding(false);
  };

  const addSubmissionToPaper = (paperId: string) => {
  if (!subVenue || !subDate) return;
  const paper = papers.find(p => p.id === paperId);
  if (!paper) return;
  
  const newSub = {
    id: uuidv4(),
    venue: subVenue,
    submitDate: subDate,
    status: '已投出' as PaperStatus,
    note: '',
    events: [{ id: uuidv4(), date: subDate, status: '投递' }]
  };
  
  let newOverallStatus = paper.status;
  if (['规划中', '撰写中', '准备投稿'].includes(paper.status)) {
      newOverallStatus = '已投出';
  }
  
  updatePaper(paperId, { status: newOverallStatus, submissions: [...(paper.submissions||[]), newSub] });
  setAddingSubId(null); setSubVenue(''); setSubDate('');
};

  const updateSubNote = (paperId: string, subId: string, note: string) => {
    const paper = papers.find(p => p.id === paperId);
    if (!paper) return;
    const newSubs = paper.submissions.map(s => s.id === subId ? { ...s, note } : s);
    updatePaper(paperId, { submissions: newSubs });
  };

  const updateSubField = (paperId: string, subId: string, field: 'submitDate'|'underReviewDate'|'revisionDate'|'acceptDate'|'venue', val: string) => {
  const paper = papers.find(p => p.id === paperId);
  if (!paper) return;
  const newSubs = paper.submissions.map(s => s.id === subId ? { ...s, [field]: val } : s);
  updatePaper(paperId, { submissions: newSubs });
};

const deleteSubmissionEvent = (paperId: string, subId: string, eventId: string) => {
  const paper = papers.find(p => p.id === paperId);
  if (!paper) return;
  const newSubs = paper.submissions.map(s => {
    if (s.id === subId && s.events) {
      return { ...s, events: s.events.filter(e => e.id !== eventId) };
    }
    return s;
  });
  updatePaper(paperId, { submissions: newSubs });
};

const updateSubmissionEventDate = (paperId: string, subId: string, eventId: string, newDate: string) => {
  const paper = papers.find(p => p.id === paperId);
  if (!paper) return;
  const newSubs = paper.submissions.map(s => {
    if (s.id === subId && s.events) {
      return { ...s, events: s.events.map(e => e.id === eventId ? { ...e, date: newDate } : e) };
    }
    return s;
  });
  updatePaper(paperId, { submissions: newSubs });
};
  
  const finishReviewStatus = (paperId: string, subId: string, finalStatus: PaperStatus) => {
  const paper = papers.find(p => p.id === paperId);
  if (!paper) return;
  const today = format(new Date(), 'yyyy-MM-dd');
  const newSubs = paper.submissions.map(s => {
    if (s.id === subId) {
      const events = s.events || [];
      if (!events.some(e => e.status === '投递')) {
         events.unshift({ id: uuidv4(), date: s.submitDate || today, status: '投递' });
      }
      const updated = { ...s, status: finalStatus, events: [...events, { id: uuidv4(), date: today, status: finalStatus }] };
      if (finalStatus === '大修' || finalStatus === '小修') {
         updated.revisionDate = s.revisionDate || today;
      }
      if (finalStatus === '录用' || finalStatus === '已录用') {
         updated.acceptDate = s.acceptDate || today;
      }
      return updated;
    }
    return s;
  });
  
  let overallStatus = paper.status;
  const hasAccepted = newSubs.some(s => s.status === '录用' || s.status === '已录用');
  const hasReview = newSubs.some(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any));
  if (hasAccepted) overallStatus = '已录用';
  else if (hasReview) overallStatus = '审稿中';
  else overallStatus = '已投出';
  
  if (finalStatus === '录用' || finalStatus === '已录用') {
    const sub = newSubs.find(x => x.id === subId);
    setAcceptedPaperInfo({ id: paperId, title: paper.title, venue: sub?.venue || paper.targetVenue });
    setActiveTab('published');
  }
  
  updatePaper(paperId, { status: hasAccepted ? '已录用' : overallStatus, submissions: newSubs });
};

  const handleConfirmAcceptance = () => {
    if (!acceptedPaperInfo) return;
    
    const paper = papers.find(p => p.id === acceptedPaperInfo.id);
    let historyStr = '';
    if (paper) {
       const acceptedSub = paper.submissions?.find(s => s.status === '已录用' && s.venue === acceptedPaperInfo.venue) 
                          || paper.submissions?.find(s => s.venue === acceptedPaperInfo.venue);
       if (acceptedSub) {
          historyStr = `[时间线] 首次投递: ${acceptedSub.submitDate} | 录用时间: ${format(new Date(), 'yyyy-MM-dd')}`;
       }
    }

    addAchievement({
      dateString: format(new Date(), 'yyyy-MM-dd'),
      title: acceptedPaperInfo.title,
      description: acceptedPaperInfo.venue,
      category: '已发论文',
      otherNote: historyStr,
      reflection: reflection
    });
    setAcceptedPaperInfo(null);
    setReflection('');
    setActiveTab('published'); 
  };

  const renderPaperStatusBadge = (s: PaperStatus) => {
    if (s === '规划中') return <span className="bg-line/50 text-[#555] px-2 py-0.5 rounded-[6px] text-[11px] font-bold">{s}</span>;
    if (s === '撰写中') return <span className="bg-[#FAF8F6] border border-sage text-sage px-2 py-0.5 rounded-[6px] text-[11px] font-bold border-dashed">{s}</span>;
    if (s === '准备投稿') return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-[6px] text-[11px] font-bold">{s} Ready</span>;
    if (s === '已投出') return <span className="bg-[#FAF8F6] border border-sage/40 text-sage px-2 py-0.5 rounded-[6px] text-[11px] font-bold">已投出 ⏳</span>;
    if (s === '审稿中') return <span className="bg-orange-50/50 border border-orange-100 text-[#d97706] px-2 py-0.5 rounded-[6px] text-[11px] font-bold">审稿中 📬</span>;
    if (s === '大修' || s === '小修') return <span className="bg-[#FAF8F6] border border-terracotta/40 text-terracotta px-2 py-0.5 rounded-[6px] text-[11px] font-bold">返修中 R&R</span>;
    if (s === '已录用' || s === '录用') return <span className="bg-sage text-white px-2 py-0.5 rounded-[6px] text-[11px] font-bold shadow-sm">🎊 已录用</span>;
    if (s === '被拒稿' || s === '拒稿') return <span className="bg-[#FAF8F6] border border-text-muted/40 text-text-muted px-2 py-0.5 rounded-[6px] text-[11px] font-bold">已拒稿</span>;
    if (s === '其他' || s === '其他') return <span className="bg-purple-50 border border-purple-100 text-purple-600 px-2 py-0.5 rounded-[6px] text-[11px] font-bold">其他状态</span>;
    return <span className="bg-line/30 text-text-muted px-2 py-0.5 rounded-[6px] text-[11px] font-bold">{s}</span>;
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Congratulations Modal */}
      {acceptedPaperInfo && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-card w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-line animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
             <button onClick={() => setAcceptedPaperInfo(null)} className="absolute top-4 right-4 p-2 text-text-muted hover:bg-line/50 rounded-full transition-colors z-20">
               <X size={20} />
             </button>
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sage via-terracotta to-dustblue" />
             <div className="mb-6 inline-flex w-20 h-20 bg-sage/10 rounded-full items-center justify-center text-sage animate-bounce">
               <CheckCircle2 size={48} />
             </div>
             <h3 className="text-[24px] font-bold font-serif text-text-main mb-2">太棒了，恭喜录用！</h3>
             <p className="text-text-muted text-[14px] mb-6">您的论文《{acceptedPaperInfo.title}》已被成功接收。这一刻值得铭记。</p>
             
             <div className="text-left space-y-4 mb-8">
               <label className="block text-[13px] font-bold text-text-muted uppercase tracking-wider">背后的心路历程 (备注)</label>
               <textarea 
                 value={reflection} onChange={e => setReflection(e.target.value)}
                 placeholder="记录下此刻的喜悦、压力或是这段旅程的感悟..."
                 className="w-full h-32 bg-base border border-line rounded-[16px] p-4 text-[14px] outline-none focus:border-sage transition-all resize-none font-serif leading-relaxed"
               />
             </div>
             
             <button 
              onClick={handleConfirmAcceptance}
              className="w-full bg-sage hover:bg-sage-dark text-white py-4 rounded-[16px] font-bold shadow-lg shadow-sage/20 transition-all active:scale-95"
             >
               同步至成就墙
             </button>
           </div>
        </div>
      )}

      <div className="flex justify-between items-start border-b border-line pb-4 md:pb-6 text-left">
        <div className="flex-1 w-full text-left">
          <h2 className="text-[20px] md:text-[24px] font-bold font-serif text-text-main flex items-center gap-2">
            <Folder size={20} className="text-sage" /> 论文进展
          </h2>
          <p className="text-[12px] md:text-[14px] text-text-muted mt-1 md:mt-2 tracking-wide text-left">追踪您的学术论文从执笔到出刊的完整历程。</p>
        </div>
        <button 
          onClick={() => isAdding ? setIsAdding(false) : handleCreate()}
          className="bg-sage hover:bg-sage-dark text-white px-3 md:px-5 py-2.5 rounded-full md:rounded-[12px] text-[13px] md:text-[14px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
        >
          {isAdding ? "取消" : <><Plus size={16}/> <span className="hidden md:inline">新增论文</span></>}
        </button>
      </div>

      <div className="flex border-Line mb-8 bg-base/30 rounded-[12px] p-1">
        <button onClick={() => setActiveTab('writing')} className={`flex-1 py-3 px-2 rounded-[10px] text-[13px] md:text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'writing' ? 'bg-card text-sage shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
          <Edit3 size={16}/> 写作
        </button>
        <button onClick={() => setActiveTab('submissions')} className={`flex-1 py-3 px-2 rounded-[10px] text-[13px] md:text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'submissions' ? 'bg-card text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
          <FileUp size={16}/> 投稿
        </button>
        <button onClick={() => setActiveTab('review')} className={`flex-1 py-3 px-2 rounded-[10px] text-[13px] md:text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'review' ? 'bg-card text-terracotta shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
          <Send size={16}/> 外审
        </button>
        <button onClick={() => setActiveTab('published')} className={`flex-1 py-3 px-2 rounded-[10px] text-[13px] md:text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'published' ? 'bg-card text-sage shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
          <CheckCircle2 size={16}/> 发表
        </button>
      </div>

      {isAdding && (
        <div className="bg-card p-6 md:p-8 rounded-card shadow-theme border border-line mb-8 border-t-4 border-t-sage relative">
           <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 p-2 text-text-muted hover:bg-line/50 rounded-full transition-colors">
              <X size={18} />
           </button>
           <h3 className="text-[18px] font-bold font-serif text-text-main mb-6">新建论文</h3>
           <form onSubmit={handleAdd} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                 <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-1">论文标题</label>
                 <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-[12px] bg-base border border-line p-3 outline-none text-[15px]"/>
               </div>
               <div>
                 <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-1">目标投递期刊/会议</label>
                 <input type="text" value={targetVenue} onChange={(e) => setTargetVenue(e.target.value)}
                  className="w-full rounded-[12px] bg-base border border-line p-3 outline-none text-[15px]"/>
               </div>
               <div>
                 <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-1">初始状态</label>
                 <select value={status} onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-[12px] bg-base border border-line p-3 outline-none text-[15px]">
                  {[...WRITING_STATUSES, ...SUBMISSION_STATUSES].map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
             </div>
             <button type="submit" className="w-full bg-text-main hover:bg-[#222] text-white py-3 rounded-[12px] font-bold mt-2">保存记录</button>
           </form>
        </div>
      )}

      {/* Render Writing Tab */}
      {activeTab === 'writing' && (
        <div className="space-y-4">
           {papers.filter(p => ['规划中', '撰写中', '准备投稿'].includes(p.status)).map(paper => (
             <div key={paper.id} className="paper-card p-6 rounded-card border shadow-theme bg-card border-line relative group cursor-pointer transition-all hover:bg-base/20" onClick={() => setExpandedWritingId(expandedWritingId === paper.id ? null : paper.id)}>
                <button onClick={(e) => { e.stopPropagation(); deletePaper(paper.id); }} className="absolute top-4 right-4 p-2 text-text-muted hover:text-terracotta opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                <div className="flex gap-2 items-center mb-2">
                  <h3 className="text-[18px] font-bold font-serif text-text-main leading-snug">{paper.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {renderPaperStatusBadge(paper.status)}
                  <span className="text-[12px] text-text-muted truncate">目标期刊: <span className="font-bold font-mono text-text-main">{paper.targetVenue || '未定 (TBD)'}</span></span>
                </div>
                
                {expandedWritingId === paper.id && (
                  <div className="mt-8 pt-8 border-t border-dashed border-line animate-in slide-in-from-top-2 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[12px] text-text-muted uppercase font-bold tracking-wider">写作进度: {paper.progress}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={paper.progress} onChange={e => updatePaper(paper.id, {progress: Number(e.target.value)})}
                        className="w-full accent-sage cursor-pointer" />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setStatusMenuOpenId(statusMenuOpenId === paper.id ? null : paper.id); }}
                          className="text-[12px] bg-base border border-line px-3 py-2 rounded-[10px] hover:bg-white text-text-main font-bold flex items-center gap-2 transition-all"
                        >
                          修改状态 <ChevronDown size={14} className={`transition-transform ${statusMenuOpenId === paper.id ? 'rotate-180' : ''}`} />
                        </button>
                        {statusMenuOpenId === paper.id && (
                          <div className="absolute bottom-full right-0 mb-2 bg-card border border-line rounded-[16px] shadow-2xl p-2 z-20 w-40 flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-200">
                             {['规划中', '撰写中', '准备投稿'].map(s => (
                               <button
                                 key={s}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   updatePaper(paper.id, { status: s as PaperStatus });
                                   setStatusMenuOpenId(null);
                                 }}
                                 className={`text-[12px] text-left px-4 py-2.5 rounded-[10px] transition-all font-bold ${paper.status === s ? 'bg-sage text-white' : 'text-text-muted hover:bg-base hover:text-text-main'}`}
                               >
                                 {s}
                               </button>
                             ))}
                          </div>
                        )}
                      </div>
                      {paper.status === '撰写中' && <button onClick={() => updatePaper(paper.id, {status: '准备投稿'})} className="text-[12px] bg-sage text-white px-4 py-2 rounded-[10px] hover:bg-sage-dark font-bold transition-all shadow-sm">已完成，准备投稿!</button>}
                      {paper.status === '准备投稿' && (
                        <button 
                          onClick={() => {
                            const newSubId = uuidv4();
                            const newSubDate = format(new Date(), 'yyyy-MM-dd');
                            updatePaper(paper.id, { 
                              status: '已投出', 
                              submissions: [...(paper.submissions || []), { id: newSubId, venue: paper.targetVenue, submitDate: newSubDate, status: '已投出', note: '' }]
                            });
                            setActiveTab('submissions');
                            setExpandedSubId(paper.id);
                          }} 
                          className="text-[12px] bg-sage text-white px-5 py-2 rounded-[10px] hover:bg-sage-dark font-bold flex items-center gap-2 transition-all shadow-sm"
                        >
                          <FileUp size={14} /> 记录正式投稿
                        </button>
                      )}
                    </div>
                  </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* Render Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
           {papers.filter(p => p.status !== '已录用' && ((p.submissions && p.submissions.length > 0) || !['规划中', '撰写中', '准备投稿'].includes(p.status))).map(paper => (
             <div key={paper.id} className="paper-card bg-card border border-line rounded-card overflow-hidden shadow-sm">
                <div 
                  onClick={() => setExpandedSubId(expandedSubId === paper.id ? null : paper.id)}
                  className="bg-base border-b border-line px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-line/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <History size={16} className="text-sage" />
                    <h3 className="font-serif font-bold text-text-main text-[16px]">{paper.title}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    {renderPaperStatusBadge(paper.status)}
                    <div className={`transition-transform duration-300 ${expandedSubId === paper.id ? 'rotate-180' : ''}`}>
                       <Plus size={16} className="text-text-muted rotate-45" />
                    </div>
                  </div>
                </div>
                
                {expandedSubId === paper.id && (
                  <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="mb-4 space-y-3">
                      {(!paper.submissions || paper.submissions.length === 0) ? (
                        <p className="text-text-muted text-[13px] italic">该文章还没有投稿历程。</p>
                      ) : (
                        paper.submissions.map(sub => (
                          <div key={sub.id} className="bg-base border border-line/60 rounded-[12px] p-4 flex flex-col md:flex-row gap-4 items-start md:items-center relative group">
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteSubmission(paper.id, sub.id); }}
                              className="absolute top-2 right-2 p-1 text-text-muted hover:text-terracotta opacity-0 group-hover:opacity-100 transition-opacity"
                              title="删除记录"
                            >
                              <X size={14} />
                            </button>
                            <div className="font-mono text-[13px] font-bold text-sage bg-card px-2 py-1 rounded inline-block whitespace-nowrap shadow-sm border border-line/20">
                              <input type="date" value={sub.submitDate} onChange={e => updateSubField(paper.id, sub.id, 'submitDate', e.target.value)} className="bg-transparent outline-none cursor-pointer" />
                            </div>
                            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
                               <input 
                                 type="text" 
                                 value={sub.venue || ''} 
                                 onChange={e => updateSubField(paper.id, sub.id, 'venue', e.target.value)} 
                                 className="font-bold text-[14px] text-text-main bg-transparent outline-none hover:bg-black/5 rounded cursor-text w-full max-w-[200px]" 
                               />
                               <div className="flex gap-2">
                                 {renderPaperStatusBadge(sub.status)}
                                 {sub.status === '已投出' && (
                                   <div className="flex gap-2">
                                     <button 
                                      onClick={(e) => { e.stopPropagation(); startReview(paper.id, sub.id); }} 
                                      className="text-[11px] bg-card border border-terracotta/30 text-terracotta px-2.5 py-1 rounded-[6px] font-bold hover:bg-terracotta hover:text-white transition-all flex items-center gap-1 shadow-sm"
                                     >
                                       <Send size={10} /> 进入外审
                                     </button>
                                     <button 
                                      onClick={(e) => { e.stopPropagation(); markAsRejected(paper.id, sub.id); }} 
                                      className="text-[11px] bg-card border border-text-muted/30 text-text-muted px-2.5 py-1 rounded-[6px] font-bold hover:bg-text-muted hover:text-white transition-all flex items-center gap-1 shadow-sm"
                                     >
                                       <X size={10} /> 拒稿
                                     </button>
                                   </div>
                                 )}
                               </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {addingSubId === paper.id ? (
                      <div className="bg-base p-4 rounded-[12px] border border-line flex flex-col md:flex-row gap-3 items-end animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                         <div className="flex-1 w-full">
                           <label className="block text-[12px] text-text-muted mb-1">投递期刊/会议</label>
                           <input type="text" value={subVenue} onChange={e=>setSubVenue(e.target.value)} className="w-full p-2 border rounded font-mono text-[13px] outline-none" placeholder="Nature..." />
                         </div>
                         <div className="flex-1 w-full">
                           <label className="block text-[12px] text-text-muted mb-1">投稿时间</label>
                           <input type="date" value={subDate} onChange={e=>setSubDate(e.target.value)} className="w-full p-2 border rounded font-mono text-[13px] outline-none" />
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => addSubmissionToPaper(paper.id)} className="bg-sage text-white px-4 py-2 rounded text-[13px] font-bold">添加归档</button>
                            <button onClick={() => setAddingSubId(null)} className="bg-line text-text-main px-4 py-2 rounded text-[13px] font-bold">取消</button>
                         </div>
                      </div>
                    ) : (
                      <button onClick={(e) => {e.stopPropagation(); setAddingSubId(paper.id); setSubVenue(paper.targetVenue); setSubDate(format(new Date(), 'yyyy-MM-dd'))}} className="text-[13px] flex items-center gap-1 font-bold text-sage hover:text-sage-dark border border-dashed border-sage px-4 py-2 rounded-[12px] hover:bg-sage/5 transition-colors">
                        <Plus size={14}/> 记录一次新的投递行为
                      </button>
                    )}
                  </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* Render Review Tab */}
      {activeTab === 'review' && (
        <div className="space-y-4">
           {papers.filter(p => p.status !== '已录用' && (p.submissions?.some(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any)))).map(paper => (
              <div key={paper.id} className="paper-card bg-card border border-line rounded-card overflow-hidden shadow-sm">
                 <div 
                   onClick={() => setExpandedRevId(expandedRevId === paper.id ? null : paper.id)}
                   className="bg-[#FDF4F0] border-b border-[#F5E6E0] px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-[#F9EBE5] transition-colors"
                 >
                   <div className="flex items-center gap-3">
                     <Send size={16} className="text-terracotta" />
                     <h3 className="font-serif font-bold text-text-main text-[16px]">{paper.title}</h3>
                   </div>
                   <div className="flex items-center gap-4">
                     {renderPaperStatusBadge(paper.status)}
                     <button onClick={(e) => { e.stopPropagation(); deletePaper(paper.id); }} className="text-text-muted hover:text-terracotta transition-colors p-1" title="删除文章记录">
                       <X size={16} />
                     </button>
                     <div className={`transition-transform duration-300 ${expandedRevId === paper.id ? 'rotate-180' : ''}`}>
                       <ChevronDown size={18} className="text-text-muted" />
                     </div>
                   </div>
                 </div>
                 
                 {expandedRevId === paper.id && (
                   <div className="p-6 animate-in slide-in-from-top-2 duration-300" onClick={e => e.stopPropagation()}>
                    {(() => {
                        const reviewSubs = paper.submissions?.filter(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any)) || [];
                        if (reviewSubs.length === 0) return <p className="text-[13px] text-text-muted italic text-center py-4">暂无审核阶段的记录。可以到“投稿”模块更新状态为“进入外审”。</p>;
                        
                        return (
                          <div className="space-y-6">
                            {reviewSubs.map((sub, idx) => (
                              <div key={sub.id} className={`${idx !== 0 ? 'pt-8 border-t border-dashed border-line' : ''}`}>
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-4 border-b border-[#ebdacc] pb-2">
                                  <div>
                                     <div className="text-[14px] font-bold text-text-main flex items-center flex-wrap gap-2 mb-1">
                                       <span className="text-[14px] whitespace-nowrap">期刊：</span> 
                                       <input 
                                         type="text" 
                                         value={sub.venue || ''} 
                                         onChange={e => updateSubField(paper.id, sub.id, 'venue', e.target.value)} 
                                         className="font-mono text-terracotta bg-transparent outline-none hover:bg-black/5 rounded cursor-text w-[150px]" 
                                       /> 
                                     </div>
                                     <div className="text-[12px] text-text-muted font-bold">时间线</div>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); deleteSubmission(paper.id, sub.id); }} className="text-text-muted hover:text-terracotta p-1" title="删除记录">
                                    <X size={16} />
                                  </button>
                                </div>
                                
                                {/* Events Timeline */}
                                <div className="space-y-3 mb-6 pl-4 border-l-2 border-[#ebdacc] ml-2">
                                  {(sub.events && sub.events.length > 0) ? sub.events.map((ev, i) => (
                                    <div key={ev.id} className="relative flex items-center gap-3">
                                      <div className="absolute -left-[21px] w-[10px] h-[10px] rounded-full bg-base border-[2px] border-terracotta" />
                                      <span className="bg-base border border-line text-[11px] font-bold text-text-muted px-2 py-0.5 rounded-[6px]">{ev.status}</span>
                                      <input 
                                          type="date" 
                                          value={ev.date} 
                                          onChange={e => updateSubmissionEventDate(paper.id, sub.id, ev.id, e.target.value)} 
                                          className="bg-transparent font-mono text-[13px] font-bold hover:bg-black/5 rounded outline-none p-0.5 cursor-pointer max-w-[130px] text-text-main" 
                                      />
                                      <button onClick={(e) => { e.stopPropagation(); deleteSubmissionEvent(paper.id, sub.id, ev.id); }} className="text-text-muted hover:text-terracotta ml-auto px-1">
                                        <X size={14} className="transition-all"/>
                                      </button>
                                    </div>
                                  )) : (
                                    <div className="relative flex items-center gap-3">
                                      <div className="absolute -left-[21px] w-[10px] h-[10px] rounded-full bg-base border-[2px] border-line" />
                                      <span className="text-[13px] italic text-text-muted">暂无时间节点记录</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <span className="text-[12px] font-bold text-text-muted flex items-center mr-2">新增状态:</span>
                                  {['审稿中', '大修', '小修', '已录用', '拒稿', '其他'].map((s: any) => {
    if (s === '其他' && customStatusInput?.paperId === paper.id && customStatusInput?.subId === sub.id) {
       return (
          <div key={s} className="flex items-center gap-1 bg-base border border-terracotta rounded-[8px] pl-2 overflow-hidden shadow-sm">
            <input 
              autoFocus 
              value={customStatusInput.value} 
              onChange={e => setCustomStatusInput({...customStatusInput, value: e.target.value})}
              className="w-20 bg-transparent text-[12px] font-bold outline-none" 
              placeholder="如: 终审"
            />
            <button 
              onClick={() => {
                if(customStatusInput.value.trim()){
                   finishReviewStatus(paper.id, sub.id, customStatusInput.value.trim() as any);
                }
                setCustomStatusInput(null);
              }}
              className="bg-terracotta text-white px-2 py-1.5 text-[12px] font-bold hover:bg-terracotta-dark"
            >确认</button>
            <button onClick={() => setCustomStatusInput(null)} className="px-2 text-text-muted hover:text-terracotta"><X size={12}/></button>
          </div>
       );
    }
    return (
      <button 
         key={s} onClick={() => {
           if(s === '其他') {
             setCustomStatusInput({paperId: paper.id, subId: sub.id, value: ''});
           } else {
             finishReviewStatus(paper.id, sub.id, s);
           }
         }}
         className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition-all border ${sub.status === s ? 'bg-terracotta text-white border-transparent shadow-sm' : 'bg-card border-[#ebdacc] text-text-main hover:border-terracotta'}`}
      >
        {s}
      </button>
    );
})}
                                </div>
                               </div>
                             ))}
                           </div>
                         );
                      })()}
                   </div>
                 )}
              </div>
            ))}
        </div>
      )}
      {/* Render Published Tab */}
      {activeTab === 'published' && (
        <div className="space-y-4">
           {papers.filter(p => p.status === '已录用').map(paper => (
             <div key={paper.id} className="paper-card bg-card border border-line rounded-card overflow-hidden shadow-theme">
                <div 
                  onClick={() => setExpandedPublishedId(expandedPublishedId === paper.id ? null : paper.id)}
                  className="bg-[#f0f9f0] border-b border-[#e0ede0] px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-[#eaf5ea] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-sage" />
                    <h3 className="font-serif font-bold text-text-main text-[17px]">{paper.title}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    {renderPaperStatusBadge(paper.status)}
                    <div className={`transition-transform duration-300 ${expandedPublishedId === paper.id ? 'rotate-180' : ''}`}>
                      <ChevronDown size={18} className="text-text-muted" />
                    </div>
                  </div>
                </div>
                
                {expandedPublishedId === paper.id && (
                  <div className="p-6 md:p-8 animate-in slide-in-from-top-2 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="mb-8">
                       <div className="flex justify-between items-center mb-4">
                         <h4 className="text-[13px] font-bold text-text-muted uppercase tracking-wider">投稿历程</h4>
                         <span className="text-[12px] bg-sage/10 text-sage px-3 py-1 rounded-full font-bold">已录用刊物: {paper.submissions?.find(s => s.status === '已录用')?.venue || paper.targetVenue}</span>
                       </div>
                       <div className="space-y-4 pt-2">
                         {(() => {
                           const acceptedSub = paper.submissions?.find(s => s.status === '已录用' || s.status === '录用');
                           const relevantSubs = paper.submissions?.filter(s => s.venue === (acceptedSub?.venue || paper.targetVenue)) || [];
                           return relevantSubs.map((sub, idx) => (
                             <div key={sub.id} className="relative">
                               <div className="bg-sage/5 p-4 rounded-[20px] border border-sage/10 relative group mb-4">
                                  <div className="font-bold text-[15px] text-text-main mb-3">{sub.venue} 的时间线</div>
                                  
                                  <div className="space-y-3 pl-4 border-l-2 border-sage/20 ml-2">
                                  {(sub.events && sub.events.length > 0) ? sub.events.map((ev, i) => (
                                    <div key={ev.id} className="relative flex items-center gap-3">
                                      <div className={`absolute -left-[21px] w-[10px] h-[10px] rounded-full bg-base border-[2px] ${ev.status === '已录用' || ev.status === '录用' ? 'border-sage' : 'border-[#ebdacc]'}`} />
                                      <span className={`bg-base border border-line text-[11px] font-bold px-2 py-0.5 rounded-[6px] ${ev.status === '已录用' || ev.status === '录用' ? 'text-sage' : 'text-text-muted'}`}>{ev.status}</span>
                                      <input 
                                          type="date" 
                                          value={ev.date} 
                                          onChange={e => updateSubmissionEventDate(paper.id, sub.id, ev.id, e.target.value)} 
                                          className="bg-transparent font-mono text-[13px] font-bold hover:bg-black/5 rounded outline-none p-0.5 cursor-pointer max-w-[130px] text-text-main" 
                                      />
                                      <button onClick={(e) => { e.stopPropagation(); deleteSubmissionEvent(paper.id, sub.id, ev.id); }} className="text-text-muted hover:text-terracotta ml-auto px-1">
                                        <X size={14} className="transition-all"/>
                                      </button>
                                    </div>
                                  )) : (
                                    <div className="relative flex items-center gap-3">
                                      <div className="absolute -left-[21px] w-[10px] h-[10px] rounded-full bg-base border-[2px] border-line" />
                                      <span className="text-[13px] italic text-text-muted">暂无详细时间记录</span>
                                    </div>
                                  )}
                                </div>
                               </div>
                             </div>
                           ));
                         })()}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 mb-8 border-b border-line/40">
                      <div className="col-span-1 md:col-span-2">
                         {editingPublishedId === paper.id ? (
                           <div className="space-y-4 bg-base p-4 rounded-[16px] border border-line">
                              <div><label className="text-[12px] text-text-muted mb-1 block">论文标题</label><input type="text" value={pubEditState.title} onChange={e=>setPubEditState({...pubEditState, title: e.target.value})} className="w-full p-2 border rounded-[12px]"/></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[12px] text-text-muted mb-1 block">出版期刊/会议</label><input type="text" value={pubEditState.venue} onChange={e=>setPubEditState({...pubEditState, venue: e.target.value})} className="w-full p-2 border rounded-[12px]"/></div>
                                <div><label className="text-[12px] text-text-muted mb-1 block">正式发表时间</label><input type="date" value={pubEditState.publishDate} onChange={e=>setPubEditState({...pubEditState, publishDate: e.target.value})} className="w-full p-2 border rounded-[12px]"/></div>
                              </div>
                              <div><label className="text-[12px] text-text-muted mb-1 block">出版状态/备注 (如: In Press, 见刊)</label><input type="text" value={pubEditState.publishStatusNote} onChange={e=>setPubEditState({...pubEditState, publishStatusNote: e.target.value})} className="w-full p-2 border rounded-[12px]"/></div>
                              
                              <div className="pt-2 border-t border-line">
                                <label className="text-[12px] font-bold text-text-muted mb-2 block uppercase tracking-wider">自定义额外信息项</label>
                                {Object.entries(pubEditState.customFields || {}).map(([cKey, cVal]) => (
                                   <div key={cKey} className="flex gap-2 mb-2 items-center">
                                      <span className="bg-card px-2 py-1 border rounded-[6px] text-[12px] font-mono text-terracotta">{cKey}</span>
                                      <input type="text" value={cVal} onChange={e => setPubEditState({...pubEditState, customFields: {...pubEditState.customFields, [cKey]: e.target.value}})} className="flex-1 p-1.5 border rounded-[8px] text-[13px]"/>
                                      <button onClick={() => { const newF = {...pubEditState.customFields}; delete newF[cKey]; setPubEditState({...pubEditState, customFields: newF}); }} className="text-text-muted hover:text-terracotta p-1"><X size={14}/></button>
                                   </div>
                                ))}
                                <div className="flex gap-2 items-center mt-2">
                                  <input type="text" placeholder="项名 (如: DOI)" value={pubEditState.newFieldKey} onChange={e=>setPubEditState({...pubEditState, newFieldKey: e.target.value})} className="flex-[1.5] min-w-0 p-2 border rounded-[8px] text-[13px]"/>
                                  <input type="text" placeholder="项值" value={pubEditState.newFieldValue} onChange={e=>setPubEditState({...pubEditState, newFieldValue: e.target.value})} className="flex-1 min-w-0 p-2 border rounded-[8px] text-[13px]"/>
                                  <button onClick={() => { if(pubEditState.newFieldKey) setPubEditState({...pubEditState, customFields: {...pubEditState.customFields, [pubEditState.newFieldKey]: pubEditState.newFieldValue}, newFieldKey: '', newFieldValue: ''}) }} className="bg-line px-3 py-2 border rounded-[8px] text-[13px] hover:bg-line/80"><Plus size={14}/></button>
                                </div>
                              </div>
                           </div>
                         ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {/* Replaced by robust timeline above */} 
                              <div className="bg-terracotta/5 p-5 rounded-[24px] border border-terracotta/10 relative group">
                                <div className="text-[12px] text-terracotta font-bold uppercase tracking-wider mb-2 flex justify-between items-center">
                                   <span>发表时间 & 状态</span>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setEditingPublishedId(paper.id);
                                       setPubEditState({
                                          title: paper.title,
                                          venue: paper.targetVenue || '',
                                          publishDate: paper.publishDate || '',
                                          publishStatusNote: paper.publishStatusNote || '',
                                          customFields: paper.customFields || {},
                                          newFieldKey: '',
                                          newFieldValue: ''
                                       });
                                     }}
                                     className="bg-card border border-terracotta/20 text-terracotta hover:bg-white px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                   >
                                     <Edit3 size={14} /> 完善
                                   </button>
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-[16px] font-bold text-text-main">{paper.publishDate || '暂未归档发表时间'}</div>
                                  <div className="text-[13px] text-text-muted font-bold">{paper.publishStatusNote || '正式录用 / 待出版'}</div>
                                </div>
                              </div>
                              {paper.customFields && Object.entries(paper.customFields).map(([k, v]) => (
                                <div key={k} className="bg-base p-4 rounded-[16px] border border-line flex flex-col">
                                   <span className="text-[11px] text-text-muted tracking-wide uppercase font-bold mb-1">{k}</span>
                                   <span className="text-[14px] font-bold text-text-main">{v}</span>
                                </div>
                              ))}
                           </div>
                         )}
                      </div>
                    </div>

                    {editingPublishedId === paper.id ? (
                      <div className="flex justify-end gap-3">
                         <button 
                             onClick={() => {
                               updatePaper(paper.id, { 
                                 title: pubEditState.title,
                                 targetVenue: pubEditState.venue,
                                 publishDate: pubEditState.publishDate, 
                                 publishStatusNote: pubEditState.publishStatusNote,
                                 customFields: pubEditState.customFields
                               });
                               setEditingPublishedId(null);
                             }}
                             className="bg-sage text-white px-6 py-2.5 rounded-[12px] text-[14px] font-bold shadow-lg shadow-sage/20 hover:bg-sage-dark transition-all"
                           >
                             保存修改
                           </button>
                           <button onClick={() => setEditingPublishedId(null)} className="bg-line px-6 py-2.5 rounded-[12px] text-[14px] font-bold text-text-main hover:bg-line/80 transition-all">
                             取消
                           </button>
                      </div>
                    ) : null}
                  </div>
                )}
             </div>
           ))}
           {papers.filter(p => p.status === '已录用').length === 0 && (
             <div className="text-center py-20 bg-card rounded-card border border-dashed border-line">
                <CheckCircle2 size={40} className="mx-auto text-line mb-4" />
                <p className="text-text-muted italic">学术硕果累累之日，便是此处繁花似锦之时。</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
