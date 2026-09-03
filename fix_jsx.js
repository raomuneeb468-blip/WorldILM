import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The issue was:
// {m.role === "user" ? (
//   <div className="flex flex-col items-end gap-1 max-w-[85%] group">
//     <div className="bg-zinc-100 text-zinc-800 px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
//       ...
//     </div>
//   </div>
// ) : (

// In my script I did:
// content = content.replace(/\{\/\* Reactions & Reaction Picker Trigger \*\/\}[\s\S]*?\{\/\* Picker Dropdown \*\/\}[\s\S]*?<\/div>\s*<\/div>/g, '');
// That removed the two closing `</div>` tags that belong to the outer containers!

// I need to add those back. Let's find:
// {m.content}
// </div>
// </div></div>) : (

content = content.replace(/\{m\.content\}\s*<\/div>\s*<\/div><\/div>\) : \(/g, '{m.content}\n</div>\n</div>\n) : (');

fs.writeFileSync('src/App.tsx', content);
