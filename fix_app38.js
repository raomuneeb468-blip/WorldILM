import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const activeReactions = reactions[\s\S]*?\] : \[\];/g, '');
content = content.replace(/\{\/\* Emoji Reactions INCLUDED inside AI written content \*\/\}[\s\S]*?\}\)/g, '');
content = content.replace(/\{\/\* Emoji Reaction Button \*\/\}[\s\S]*?<\/button>\s*\}\)\}\s*<\/div>\s*<\/>\s*\}/g, '');
content = content.replace(/\{activeReactionPickerId === m\.id && \([\s\S]*?<\/div>\s*<\/>\s*\}/g, '');
// Let's remove any trace of activeReactionPickerId
content = content.replace(/<button[^>]+setActiveReactionPickerId[^>]+>[\s\S]*?<\/button>/g, '');

fs.writeFileSync('src/App.tsx', content);
