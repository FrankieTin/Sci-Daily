const fs = require('fs');

const content = fs.readFileSync('src/components/PaperProgress.tsx', 'utf8');

// I will find everything from `<div key={paper.id} className="paper-card bg-card border border-line rounded-card overflow-hidden shadow-sm">`
// up to `                     })()}`
// And replace it purely programmatically using JS substring.

let startIdx = content.indexOf('className="bg-[#FDF4F0] border-b border-[#F5E6E0] px-6 py-4 flex justify-between items-center');

let endIdx = content.indexOf('textarea \n                                  value={sub.note || \'\'} onChange={e => updateSubNote');

if(endIdx === -1) {
    endIdx = content.indexOf('<textarea \n                                  value={sub.note || \'\'} onChange={e => updateSubNote(paper.id, sub.id, e.target.value)}');
}

const replacement = `className="bg-[#FDF4F0] border-b border-[#F5E6E0] px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-[#F9EBE5] transition-colors"
                 >
                   <div className="flex items-center gap-3">
                     <Send size={16} className="text-terracotta" />
                     <h3 className="font-serif font-bold text-text-main text-[16px]">{paper.title}</h3>
                   </div>
                   <div className="flex items-center gap-4">
                     {renderPaperStatusBadge(paper.status)}
                     <div className={\`transition-transform duration-300 \${expandedRevId === paper.id ? 'rotate-180' : ''}\`}>
                       <Plus size={16} className="text-text-muted rotate-45" />
                     </div>
                   </div>
                 </div>
                 
                 {expandedRevId === paper.id && (
                   <div className="p-6 animate-in slide-in-from-top-2 duration-300" onClick={e => e.stopPropagation()}>
                    {(() => {
                        const reviewSubs = paper.submissions?.filter(s => ['审稿中', '大修', '小修'].includes(s.status)) || [];
                        if (reviewSubs.length === 0) return <p className="text-[13px] text-text-muted italic text-center py-4">暂无审核阶段的记录。可以到“投稿”模块更新状态为“进入外审”。</p>;
                        
                        return (
                          <div className="space-y-8">
                            {reviewSubs.map((sub, idx) => (
                              <div key={sub.id} className={\`\${idx !== 0 ? 'pt-8 border-t border-dashed border-line' : ''}\`}>
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-[#ebdacc] pb-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                     <div className="text-[13px] text-text-muted">
                                       在 <input 
                                         type="text" 
                                         value={sub.venue || ''} 
                                         onChange={e => updateSubField(paper.id, sub.id, 'venue', e.target.value)} 
                                         className="font-mono font-bold text-terracotta bg-transparent outline-none hover:bg-black/5 rounded cursor-text w-[120px]" 
                                       /> 投递 
                                       <input type="date" value={sub.submitDate} onChange={e => updateSubField(paper.id, sub.id, 'submitDate', e.target.value)} className="bg-transparent font-mono font-bold hover:bg-black/5 rounded outline-none p-0.5 cursor-pointer ml-1" />
                                     </div>
                                     {(sub.underReviewDate || ['审稿中', '大修', '小修', '已录用', '被拒稿'].includes(sub.status)) && (
                                        <div className="text-[13px] text-text-muted flex items-center gap-1">
                                          | 外审: <input type="date" value={sub.underReviewDate || ''} onChange={(e) => updateSubField(paper.id, sub.id, 'underReviewDate', e.target.value)} className="bg-transparent font-mono font-bold hover:bg-black/5 rounded outline-none p-0.5 cursor-pointer w-[125px]" />
                                        </div>
                                     )}
                                     {(sub.revisionDate || ['大修', '小修'].includes(sub.status)) && (
                                        <div className="text-[13px] text-text-muted flex items-center gap-1">
                                          | 返修: <input type="date" value={sub.revisionDate || ''} onChange={(e) => updateSubField(paper.id, sub.id, 'revisionDate', e.target.value)} className="bg-transparent font-mono font-bold hover:bg-black/5 rounded outline-none p-0.5 cursor-pointer w-[125px]" />
                                        </div>
                                     )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteSubmission(paper.id, sub.id); }}
                                      className="text-text-muted hover:text-terracotta transition-colors flex items-center gap-1 text-[12px] font-bold"
                                      title="删除记录"
                                    >
                                      <X size={15} />
                                    </button>
                                  </div>
                                </div>
                                <`;

const finalContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + 1);

fs.writeFileSync('src/components/PaperProgress.tsx', finalContent);

console.log("Done patching length: ", finalContent.length);
