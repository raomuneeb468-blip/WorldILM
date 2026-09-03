import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will NOT use regex to remove divs! I will simply hide the emoji buttons using CSS or conditionally remove them by searching for the EXACT string of the components.

// Let's replace the REACTION_EMOJIS constant with an empty array so no emojis render.
content = content.replace(/const REACTION_EMOJIS = \["👍", "❤️", "😂", "😮", "😢", "🙏"\];/g, 'const REACTION_EMOJIS: string[] = [];');

// To remove the "smile" button in the assistant message:
// It has className="w-7 h-7 flex items-center justify-center border border-zinc-150 hover:bg-zinc-50 rounded text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer text-xs"
// title="React to message"
// > 😊 </button>
content = content.replace(/<button[^>]+title="React to message"[^>]*>[\s\S]*?😊[\s\S]*?<\/button>/g, '');

// To remove the "smile" button in the user message:
// title="React to message" again? No, let's see.
content = content.replace(/<button[^>]*>[\s\S]*?😊[\s\S]*?<\/button>/g, '');

// To remove existing reactions rendered:
// {activeReactions.map(([emoji, count]) => ...
// I will just change activeReactions to always be empty.
content = content.replace(/const activeReactions = reactions \? \(Object\.entries\(reactions\) as \[string, number\]\[\]\)\.filter\(\(\[_, count\]\) => count > 0\) : \[\];/g, 'const activeReactions: any[] = [];');

// For the image reactions, change the render condition to false.
content = content.replace(/\{m\.reactions && \(Object\.entries\(m\.reactions\) as \[string, number\]\[\]\)\.some\(\(\[_, count\]\) => count > 0\) && \(/g, '{false && (');

fs.writeFileSync('src/App.tsx', content);
