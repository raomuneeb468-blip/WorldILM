import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove handleAddReaction
content = content.replace(/const handleAddReaction = \([^)]+\) => \{[\s\S]*?\n  \};\n/g, '');

// Remove REACTION_EMOJIS constant and imports if any
content = content.replace(/const REACTION_EMOJIS = \[.*?\];\n/g, '');
content = content.replace(/const \[activeReactionPickerId, setActiveReactionPickerId\] = useState<string \| null>\(null\);\n/g, '');

// Remove from MemoizedAssistantContent
content = content.replace(/reactions\?: Record<string, number>;\n/g, '');
content = content.replace(/onAddReaction: \(emoji: string\) => void;\n/g, '');
content = content.replace(/reactions,\n  onAddReaction,\n/g, '');
content = content.replace(/const prevReactions = prev\.reactions \|\| \{\};\n  const nextReactions = next\.reactions \|\| \{\};\n  if \(Object\.keys\(prevReactions\)\.length !== Object\.keys\(nextReactions\)\.length\) return false;\n  for \(const key in prevReactions\) \{\n    if \(prevReactions\[key\] !== nextReactions\[key\]\) return false;\n  \}\n/g, '');

// Replace reaction JSX in assistant messages
content = content.replace(/\{\/\* Existing Reactions \*\/\}[\s\S]*?\{\/\* Reaction Trigger Button \(Smile icon\) \*\/\}[\s\S]*?\{\/\* Picker Dropdown \*\/\}[\s\S]*?<\/div>\s*<\/div>/g, '</div></div>');

// Replace reaction JSX in user messages
content = content.replace(/\{\/\* Reactions & Reaction Picker Trigger \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\) : \(/g, '</div></div>) : (');

// Remove reaction picker for images
content = content.replace(/\{\/\* Reaction Picker for Image result \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\) : \(/g, '</div></div></div>) : (');

// Remove from message map props
content = content.replace(/reactions=\{m\.reactions\}\n\s*onAddReaction=\{\(emoji\) => handleAddReaction\(m\.id, emoji\)\}/g, '');

fs.writeFileSync('src/App.tsx', content);
