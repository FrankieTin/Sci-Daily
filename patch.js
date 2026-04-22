const fs = require('fs');
let content = fs.readFileSync('src/components/PaperProgress.tsx', 'utf8');

// 1. "外审"栏目下的 × 删除该文章的所有信息 
// Note: We need to change the cross in the paper card header to be an actual delete paper button, and bring back a dropdown icon for expansion.
const reviewCardHeaderRegex = /<Plus size=\{16\} className="text-text-muted rotate-45" \/>/g;
// Actually we can just add a trash button next to the chevron or replace the cross with a proper trash button.
// The code is currently:
// <div className={`transition-transform duration-300 ${expandedRevId === paper.id ? 'rotate-180' : ''}`}>
//   <Plus size={16} className="text-text-muted rotate-45" />
// </div>

const reviewActionsRegex = /<div className=\{"transition-transform duration-300 \$\{expandedRevId === paper\.id \? 'rotate-180' : ''\}"\}>\s*<Plus size=\{16\} className="text-text-muted rotate-45" \/>\s*<\/div>/g;

content = content.replace(reviewActionsRegex, 
  `<button onClick={(e) => { e.stopPropagation(); deletePaper(paper.id); }} className="text-text-muted hover:text-terracotta transition-colors p-1" title="删除文章记录">\n                       <X size={16} />\n                     </button>\n                     <div className={\`transition-transform duration-300 \${expandedRevId === paper.id ? 'rotate-180' : ''}\`}>\n                       <ChevronDown size={18} className="text-text-muted" />\n                     </div>`);


// 2. 状态里的"其他"按钮，添加后的状态应与"审稿中""大修""小修"保持一致，即不跳转"发表"栏目，并且要在右侧和时间线里更新。
// We solved this by updating finishReviewStatus logic!
// We need to change `hasReview = newSubs.some(s => ['审稿中', '大修', '小修', '其他'].includes(s.status));`
// to something that includes all statuses EXCEPT ones that mean it's un-reviewed or accepted. 
// Just check for NOT '已投出', '录用', '已录用', '拒稿', '被拒稿'. 
// Or simply check if the events array has review statuses!
const hasReviewRegex = /const hasReview = newSubs\.some\(s => \['审稿中', '大修', '小修', '其他'\]\.includes\(s\.status\)\);/;
content = content.replace(hasReviewRegex, 
  `const hasReview = newSubs.some(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any));`);

const reviewFilterRegex = /p\.submissions\?\.some\(s => \['审稿中', '大修', '小修', '其他'\]\.includes\(s\.status\)\)/g;
content = content.replace(reviewFilterRegex, 
  `p.submissions?.some(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any))`);

const reviewSubsRegex = /const reviewSubs = paper\.submissions\?\.filter\(s => \['审稿中', '大修', '小修', '其他'\]\.includes\(s\.status\)\) \|\| \[\];/;
content = content.replace(reviewSubsRegex, 
  `const reviewSubs = paper.submissions?.filter(s => !['已投出', '录用', '已录用', '拒稿', '被拒稿'].includes(s.status as any)) || [];`);


// 3. 将"在xx期刊的时间线"的顺序与内容调整为"期刊：xxx(抓取具体期刊名称)"，"时间线"转到第二行。取消文字删除按钮，换成X号。
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


// 4. “发表”栏目下，将"完善信息"的button简化为"完善"，移至"发表时间&状态"这个框的右侧
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

// remove the edit button at bottom 
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
