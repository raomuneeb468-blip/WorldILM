import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Inside MemoizedAssistantContent
content = content.replace(/const activeReactions = reactions[\s\S]*?\] : \[\];/g, '');
content = content.replace(/\{\/\* Emoji Reactions INCLUDED inside AI written content \*\/\}[\s\S]*?\}\)/g, '');

// The map inside MemoizedAssistantContent might have been partially removed, let's just do a string replace of the entire block.
content = content.replace(/\{\/\* Emoji Reactions INCLUDED inside AI written content \*\/\}[\s\S]*?<\/div>\n      \}\)/g, '})');

// We need to just search for `activeReactionPickerId` and `REACTION_EMOJIS` and remove them from the UI.
// Also remove activeReactions.

fs.writeFileSync('src/App.tsx', content);
