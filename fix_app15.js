import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const activeReactions = reactions[\s\S]*?\] : \[\];/g, '');
content = content.replace(/\{\/\* Emoji Reactions INCLUDED inside AI written content \*\/\}[\s\S]*?<\/div>\n      \}\)/g, '})');
content = content.replace(/const prevReactions = prev\.reactions \|\| \{\};[\s\S]*?return false;\n  \}\n/g, '');

content = content.replace(/const handleAddReaction = async \([^)]+\) => \{[\s\S]*?console\.error\("Failed to save sessions after reaction:", e\);\n    \}\n  \};\n/g, '');

// from MemoizedAssistantContent props
content = content.replace(/reactions: m\.reactions,\n/g, '');
content = content.replace(/onAddReaction: \(emoji: string\) => handleAddReaction\(m\.id, emoji\),\n/g, '');

// from the map
content = content.replace(/\{\/\* Emoji Reaction Button \*\/\}[\s\S]*?\{\/\* Reaction Picker Popover \*\/\}[\s\S]*?<\/div>\n                                \}\)/g, '})');

// I will just do it the correct way: rewrite the render function for messages to cleanly exclude reactions.
