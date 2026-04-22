import React, { useState } from 'react';
import { useAppContext } from '../store';
import { AchievementCategory } from '../types';
import { format } from 'date-fns';
import { Trophy, Star, Target, Dumbbell, Zap, Trash2, Edit3, Check, X } from 'lucide-react';

const CATEGORIES: AchievementCategory[] = ['已发论文', '落地项目', '健身突破', '其他'];

export default function Achievements() {
  const { state, addAchievement, deleteAchievement, updateAchievement } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AchievementCategory>('已发论文');
  const [otherNote, setOtherNote] = useState('');
  const [dateString, setDateString] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState({ title: '', description: '', category: '已发论文' as AchievementCategory, otherNote: '', dateString: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addAchievement({ title, description, category, dateString, otherNote });
    setTitle(''); setDescription(''); setOtherNote('');
    setIsAdding(false);
  };

  const sortedAchievements = [...(state.achievements || [])].sort((a,b) => b.timestamp - a.timestamp);

  const getCategoryIcon = (cat: AchievementCategory) => {
    switch (cat) {
      case '已发论文': return <Star size={20} className="text-[#D49B8B]"/>;
      case '落地项目': return <Target size={20} className="text-sage"/>;
      case '健身突破': return <Dumbbell size={20} className="text-text-main"/>;
      default: return <Zap size={20} className="text-terracotta"/>;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-line pb-4 md:pb-6 text-left">
        <h2 className="text-[20px] md:text-[24px] font-bold font-serif text-text-main flex items-center gap-2">
          <Trophy size={20} className="text-terracotta"/> 小小成就
        </h2>
        <p className="text-[12px] md:text-[14px] text-text-muted mt-1 md:mt-2 tracking-wide">每一点进步都值得被铭记。在这里挂上属于自己的勋章墙。</p>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-card shadow-theme border border-line mb-8 border-t-4 border-t-terracotta transition-all duration-300">
        {!isAdding ? (
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAdding(true)}>
             <h3 className="text-[16px] md:text-[18px] font-bold font-serif text-text-main">颁发新成就</h3>
             <button className="bg-[#FAF8F6] border border-line text-terracotta px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-1 hover:bg-terracotta hover:text-white transition-colors">
               <Trophy size={14} /> 新颁发
             </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[16px] md:text-[18px] font-bold font-serif text-text-main">颁发新成就</h3>
              <button className="text-text-muted hover:bg-line/50 p-2 rounded-full transition-colors" onClick={() => setIsAdding(false)}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-top-2 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-2">成就类别</label>
                <select 
                  value={category} onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-[16px] bg-[#FAF8F6] border border-line p-3 outline-none focus:ring-1 focus:ring-sage transition-all text-text-main text-[15px]"
                >
                  {CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {category === '其他' && (
                  <input type="text" placeholder="类别备注" value={otherNote} onChange={e => setOtherNote(e.target.value)}
                    className="w-full mt-2 rounded-[16px] bg-[#FAF8F6] border border-line p-2 outline-none text-[13px] text-text-main" />
                )}
              </div>
              <div>
                <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-2">日期</label>
                <input 
                  type="date" required value={dateString} onChange={(e) => setDateString(e.target.value)}
                  className="w-full rounded-[16px] bg-[#FAF8F6] border border-line p-3 outline-none focus:ring-1 focus:ring-sage transition-all text-text-main text-[15px] font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-2">成就标题</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：ICML 2024 文章被录用！"
                  className="w-full rounded-[16px] bg-[#FAF8F6] border border-line p-3 outline-none focus:ring-1 focus:ring-sage transition-all text-text-main text-[15px]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[13px] text-text-muted uppercase tracking-wider mb-2">背后的心路历程 (可选)</label>
                <textarea 
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="三个月的奋战，感谢同门的帮助..."
                  className="w-full rounded-[16px] bg-[#FAF8F6] border border-line p-3 outline-none focus:ring-1 focus:ring-sage transition-all text-text-main text-[15px] min-h-[80px]"
                />
              </div>
           </div>
           <div className="flex justify-end pt-4">
              <button type="submit" className="bg-terracotta hover:bg-[#a36957] text-white px-8 py-3.5 rounded-[16px] text-[15px] transition-all shadow-sm flex gap-2">
                🌟 点亮成就
              </button>
            </div>
        </form>
        </>
        )}
      </div>

      <div>
        <h3 className="text-[18px] font-serif font-bold text-text-main mb-6">荣誉里程碑</h3>
        {sortedAchievements.length === 0 ? (
          <p className="text-text-muted italic text-[15px]">荣誉墙尚在等待您的第一座丰碑。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
             {sortedAchievements.map(ach => (
               <div key={ach.id} className="relative group bg-[#FAF8F6] p-7 rounded-card border border-line shadow-sm overflow-hidden flex flex-col">
                 {editingId === ach.id ? (
                   <div className="space-y-3 w-full animate-in fade-in">
                      <input type="text" value={editState.title} onChange={e=>setEditState({...editState, title: e.target.value})} className="w-full p-2 border rounded-[12px] bg-white" placeholder="成就标题"/>
                      <input type="date" value={editState.dateString} onChange={e=>setEditState({...editState, dateString: e.target.value})} className="w-full p-2 border rounded-[12px] bg-white text-text-muted text-[14px]" />
                      <textarea value={editState.description} onChange={e=>setEditState({...editState, description: e.target.value})} className="w-full p-2 border rounded-[12px] bg-white min-h-[60px]" placeholder="心路历程 / 补充说明"/>
                      <input type="text" value={editState.otherNote} onChange={e=>setEditState({...editState, otherNote: e.target.value})} className="w-full p-2 border rounded-[12px] bg-white" placeholder="附加时间线/备注"/>
                      <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => { updateAchievement(ach.id, { title: editState.title, description: editState.description, otherNote: editState.otherNote, dateString: editState.dateString }); setEditingId(null); }} className="p-2 bg-sage text-white rounded-[8px] hover:bg-sage-dark"><Check size={16}/></button>
                        <button onClick={() => setEditingId(null)} className="p-2 border bg-white rounded-[8px]"><X size={16}/></button>
                      </div>
                   </div>
                 ) : (
                   <div className="flex w-full">
                     <div className="mr-6 bg-white p-3 rounded-full border border-line shadow-sm h-fit">
                       {getCategoryIcon(ach.category)}
                     </div>
                     <div className="flex-1">
                        <div className="text-[12px] font-bold text-terracotta uppercase tracking-[1px] mb-1 opacity-80">
                          {ach.category === '其他' && ach.otherNote ? `其他 (${ach.otherNote})` : ach.category}
                        </div>
                        <h4 className="text-[18px] font-serif font-bold text-text-main leading-snug mb-3">{ach.title}</h4>
                        {ach.description && <p className="text-[14px] text-text-muted mb-4 italic">"{ach.description}"</p>}
                        {ach.otherNote && <div className="text-[13px] text-sage mb-4 p-2 bg-sage/5 border border-sage/10 rounded-[8px] whitespace-pre-wrap">{ach.otherNote}</div>}
                        <div className="text-[13px] font-mono font-bold text-sage opacity-80">{ach.dateString}</div>
                     </div>
                     <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                       <button onClick={() => { setEditingId(ach.id); setEditState({ title: ach.title, description: ach.description, category: ach.category, otherNote: ach.otherNote || '', dateString: ach.dateString }); }} className="p-2 text-text-muted hover:text-sage transition-colors">
                         <Edit3 size={18}/>
                       </button>
                       <button onClick={() => deleteAchievement(ach.id)} className="p-2 text-text-muted hover:text-terracotta transition-colors">
                         <Trash2 size={18}/>
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             ))}
          </div>
        )}
      </div>

    </div>
  );
}
