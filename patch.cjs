const fs = require('fs');
let content = fs.readFileSync('src/components/PaperProgress.tsx', 'utf8');

const reviewActionsRegex = /<div className=\{"transition-transform duration-300 \$\{expandedRevId === paper\.id \? 'rotate-180' : ''\}"\}>\s*<Plus size=\{16\} className="text-text-muted rotate-45" \/>\s*<\/div>/g;

content = content.replace(reviewActionsRegex, 
  `<button onClick={(e) => { e.stopPropagation(); deletePaper(paper.id); }} className="text-text-muted hover:text-terracotta transition-colors p-1" title="删除文章记录">\n                       <X size={16} />\n                     </button>\n                     <div className={\`transition-transform duration-300 \${expandedRevId === paper.id ? 'rotate-180' : ''}\`}>\n                       <ChevronDown size={18} className="text-text-muted" />\n                     </div>`);

const hasReviewRegex = /const hasReview = newSubs\.some\(s => \['审稿中', '大修', '小修', '其他'\]\.includes\(s\.status\)\);/;
content = content.replace(hasReviewRegex, 
  `const hasReview = newSubs.some(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any));`);

const reviewFilterRegex = /p\.submissions\?\.some\(s => \['审稿中', '大修', '小修', '其他'\]\.includes\(s\.status\)\)/g;
content = content.replace(reviewFilterRegex, 
  `p.submissions?.some(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any))`);

const reviewSubsRegex = /const reviewSubs = paper\.submissions\?\.filter\(s => \['审稿中', '大修', '小修', '其他'\]\.includes\(s\.status\)\) \|\| \[\];/;
content = content.replace(reviewSubsRegex, 
  `const reviewSubs = paper.submissions?.filter(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any)) || [];`);


const oldReviewHeaderRegex = /<div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-\[#ebdacc\] pb-4">\s*<div className="flex flex-wrap items-center gap-2">\s*<div className="text-\[13px\] text-text-muted flex items-center flex-wrap gap-2">\s*<span>在<\/span>[\s\S]*?<span>的时间线<\/span>\s*<\/div>\s*<\/div>\s*<div className="flex items-center gap-2">\s*<button[\s\S]*?删除整个记录\s*<\/button>\s*<\/div>\s*<\/div>/;

const newReviewHeader = `<div className="flex flex-wrap items-start justify-between gap-4 mb-4 border-b border-[#ebdacc] pb-2">
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
                                </div>`;

content = content.replace(oldReviewHeaderRegex, newReviewHeader);

const oldPublishStatusBoxRegex = /<div className="text-\[12px\] text-terracotta font-bold uppercase tracking-wider mb-2 flex justify-between items-center"><span>发表时间 & 状态<\/span><\/div>/;

const newPublishStatusBoxHeader = `<div className="text-[12px] text-terracotta font-bold uppercase tracking-wider mb-2 flex justify-between items-center">
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
                                </div>`;

content = content.replace(oldPublishStatusBoxRegex, newPublishStatusBoxHeader);

const bottomButtonsRegex = /<div className="flex justify-end gap-3">\s*\{editingPublishedId === paper\.id \? \([\s\S]*?取消\s*<\/button>\s*<\/>\s*\) : \([\s\S]*?完善信息\s*<\/button>\s*\)\}\s*<\/div>/;

const newBottomButtons = `{editingPublishedId === paper.id ? (
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
                    ) : null}`;

content = content.replace(bottomButtonsRegex, newBottomButtons);

fs.writeFileSync('src/components/PaperProgress.tsx', content);
