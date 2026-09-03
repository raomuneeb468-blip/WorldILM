import fs from 'fs';
let content = fs.readFileSync('tmp.txt', 'utf8');

// Fix 1: User message missing closing div
// Find `{m.content}` followed by `) : (` with only one or two `</div>` in between.
// It is `{m.content}</div></div>) : (`
content = content.replace(/\{m\.content\}\s*<\/div>\s*<\/div>\) : \(/g, '{m.content}\n</div></div></div>) : (');

// Fix 2: Image result missing closing divs
// Find `{m.imageUrl ? (` block end
content = content.replace(/<\/a>\s*<button[\s\S]*?Regenerate\s*<\/button>\s*<\/div>\s*<\/div>\) : \(/g, '</a><button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 shadow-sm transition-all cursor-pointer" onClick={() => handleSendMessage(m.prompt, m.ratio)}><RefreshCw size={12} />Regenerate</button></div></div></div></div>) : (');

// Fix 3: What about the other errors?
// src/App.tsx(4185,24): error TS1381: Unexpected token. Did you mean `}` or `&rbrace;`?
// That is likely around the Assistant Message reaction button that got corrupted.
// Wait, my `fix_app14.js` did not remove the Assistant Message emoji button! That was `fix_app19.js`! And `tmp.txt` was from BEFORE `fix_app19.js`.
// So `tmp.txt` has the Assistant Message emoji button intact!

fs.writeFileSync('src/App.tsx', content);
