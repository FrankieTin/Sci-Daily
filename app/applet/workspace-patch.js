const fs = require('fs');
let code = fs.readFileSync('src/components/PaperProgress.tsx', 'utf8');

const regex = /<\/div>\s*\}\s*\}\}\s*className="text-text-muted hover:text-sage transition-colors flex items-center gap-1 text-\[12px\] font-bold"\s*title="修改期刊\/会议"\s*>\s*<Edit3 size=\{14\} \/>\s*<\/button>\s*<button\s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); deleteSubmission\(paper\.id, sub\.id\); \}\}\s*className="text-text-muted hover:text-terracotta transition-colors flex items-center gap-1 text-\[12px\] font-bold"\s*title="删除记录"\s*>\s*<X size=\{15\} \/>\s*<\/button>\s*<\/div>\s*<\/div>/g;

code = code.replace(regex, `</div>\n                                </div>`);

console.log("Matched? " + regex.test(fs.readFileSync('src/components/PaperProgress.tsx', 'utf8')));

fs.writeFileSync('src/components/PaperProgress.tsx', code);
console.log("Done");
