import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove handleAddReaction
const handleAddReactionRegex = /const handleAddReaction = async \([^)]+\) => \{[\s\S]*?setActiveSessionId\(session\.id\);\n      \}\n    \}\n  \};\n/;
content = content.replace(handleAddReactionRegex, '');

// Remove all reaction UI in the map
content = content.replace(/\{\/\* Reactions & Reaction Picker Trigger \*\/\}[\s\S]*?\{\/\* Picker Dropdown \*\/\}[\s\S]*?<\/div>\s*<\/div>/g, '');

content = content.replace(/\{\/\* Existing Reactions \*\/\}[\s\S]*?\{\/\* Picker Dropdown \*\/\}[\s\S]*?<\/div>\s*<\/div>/g, '');

content = content.replace(/\{\/\* Reaction Picker for Image result \*\/\}[\s\S]*?<\/div>\s*<\/div>/g, '');

fs.writeFileSync('src/App.tsx', content);
