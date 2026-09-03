import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The block to remove is from {/* Emoji Reaction Button */} to the end of the picker popover.
content = content.replace(/\{\/\* Emoji Reaction Button \*\/\}[\s\S]*?<\/button>\s*\}\)\}\s*<\/div>\s*<\/>\s*\}/g, '');

// There is also an undefined `reactions` inside MemoizedAssistantContent
content = content.replace(/const activeReactions = reactions \? \(Object\.entries\(reactions\) as \[string, number\]\[\]\)\.filter\(\(\[_, count\]\) => count > 0\) : \[\];/g, '');

fs.writeFileSync('src/App.tsx', content);
