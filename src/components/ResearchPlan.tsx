import React, { useState } from 'react';
import { useAppContext } from '../store';
import { ResearchPlan } from '../types';
import { CheckCircle2, Circle, Plus, ListTodo, Map } from 'lucide-react';

export default function ResearchPlanComponent() {
  const { state, addResearchPlan, toggleResearchPlan, deleteResearchPlan } = useAppContext();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'daily'|'phase'>('daily');
  const [deadlineString, setDeadlineString] = useState('');

  const plans = state.researchPlans || [];
  const dailyPlans = plans.filter(p => p.type === 'daily').sort((a,b) => b.timestamp - a.timestamp);
  const phasePlans = plans.filter(p => p.type === 'phase').sort((a,b) => b.timestamp - a.timestamp);

  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addResearchPlan({ title, description, type, deadlineString });
    setTitle(''); setDescription(''); setDeadlineString('');
    setIsAdding(false);
  };

  const renderPlan = (plan: ResearchPlan) => (
    <div key={plan.id} className={`p-4 rounded-[16px] border ${plan.completed ? 'bg-[#FAF8F6] opacity-60 border-line' : 'bg-card border-line shadow-sm'} transition-all flex items-start gap-4 text-left w-full`}>
      <button onClick={() => toggleResearchPlan(plan.id)} className="mt-1 flex-shrink-0 focus:outline-none">
        {plan.completed ? <CheckCircle2 className="text-sage" size={20}/> : <Circle className="text-text-muted hover:text-sage transition-colors" size={20}/>}
      </button>
      <div className="flex-1 text-left w-full overflow-hidden">
        <h4 className={`text-[15px] font-bold truncate ${plan.completed ? 'text-text-muted line-through' : 'text-text-main'}`}>{plan.title}</h4>
        {plan.description && <p className="text-[13px] text-text-muted mt-1.5 leading-relaxed text-left">{plan.description}</p>}
        {plan.deadlineString && (
          <div className="mt-2 text-[11px] font-mono bg-[#FAF8F6] px-2 py-1 rounded-[6px] inline-block text-terracotta border border-line text-left items-start justify-start">
            🎯 {plan.deadlineString}
          </div>
        )}
      </div>
      <button onClick={() => deleteResearchPlan(plan.id)} className="text-text-muted hover:text-terracotta text-[12px] flex-shrink-0 bg-line/30 px-2 py-1 rounded-[6px] transition-colors ml-2">
        删除
      </button>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-line pb-4 md:pb-6 flex justify-between items-start">
        <div>
          <h2 className="text-[20px] md:text-[24px] font-bold font-serif text-text-main flex items-center gap-2">科研计划</h2>
          <p className="text-[12px] md:text-[14px] text-text-muted mt-1 md:mt-2 tracking-wide">管理您的每日重要任务或是里程碑目标。</p>
        </div>
      </div>

      <div className="bg-card p-4 md:p-6 rounded-card shadow-theme border border-line transition-all duration-300">
        {!isAdding ? (
           <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAdding(true)}>
              <div className="flex items-center gap-2 text-[15px] md:text-[16px] font-bold font-serif text-text-main">
                <Plus size={18} className="text-sage"/> 新增计划
              </div>
               <button className="bg-[#FAF8F6] border border-line text-sage p-1.5 rounded-full text-[13px] font-bold flex items-center gap-1 hover:bg-sage hover:text-white transition-colors">
                 <Plus size={16} />
               </button>
           </div>
        ) : (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-line pb-4">
              <h3 className="text-[15px] md:text-[16px] font-bold font-serif text-text-main flex items-center gap-2"><Plus size={18} className="text-sage"/> 新增计划</h3>
              <button className="text-text-muted hover:bg-line/50 p-1.5 rounded-full transition-colors" onClick={() => setIsAdding(false)}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end text-left w-full">
          <div className="w-full md:w-32">
            <label className="block text-[12px] text-text-muted uppercase mb-1">规划类型</label>
            <select value={type} onChange={e => setType(e.target.value as any)}
               className="w-full rounded-[12px] bg-[#FAF8F6] border border-line p-2.5 outline-none focus:border-sage text-[14px]">
              <option value="daily">每日计划</option>
              <option value="phase">阶段计划</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[12px] text-text-muted uppercase mb-1">计划内容</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
               className="w-full rounded-[12px] bg-[#FAF8F6] border border-line p-2.5 outline-none focus:border-sage text-[14px]" placeholder="简单的标题或想达成的目标" />
          </div>
          {type === 'phase' && (
            <div className="w-full md:w-48">
              <label className="block text-[12px] text-text-muted uppercase mb-1">截至预期节点</label>
              <input type="text" value={deadlineString} onChange={e => setDeadlineString(e.target.value)}
                 className="w-full rounded-[12px] bg-[#FAF8F6] border border-line p-2.5 outline-none focus:border-sage text-[14px]" placeholder="例如：本月底" />
            </div>
          )}
          <button type="submit" className="bg-sage hover:bg-sage-dark text-white font-medium px-6 py-2.5 rounded-[12px] transition-all shadow-sm w-full md:w-auto">
            保存计划
          </button>
        </form>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-start w-full">
          <h3 className="text-[18px] font-serif font-bold text-text-main mb-4 flex items-center gap-2 border-b border-line pb-2 w-full text-left">
            <ListTodo className="text-sage" size={20}/> 每日计划
          </h3>
          <div className="space-y-4 w-full text-left">
            {dailyPlans.length === 0 ? <p className="text-text-muted italic text-[14px] text-left">暂无每日计划记录。</p> : dailyPlans.map(renderPlan)}
          </div>
        </div>
        <div className="flex flex-col items-start w-full">
          <h3 className="text-[18px] font-serif font-bold text-text-main mb-4 flex items-center gap-2 border-b border-line pb-2 w-full text-left">
            <Map className="text-terracotta" size={20}/> 阶段计划
          </h3>
          <div className="space-y-4 w-full text-left">
            {phasePlans.length === 0 ? <p className="text-text-muted italic text-[14px] text-left">暂无阶段计划记录。</p> : phasePlans.map(renderPlan)}
          </div>
        </div>
      </div>
    </div>
  );
}
